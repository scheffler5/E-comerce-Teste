import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Readable } from 'stream';
import csvParser from 'csv-parser'; 
import { ProductCategory, Prisma } from '@prisma/client';
import { FilterProductDto } from './dto/filter-product.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  // Criação Manual
  async create(createProductDto: CreateProductDto, sellerId: string) {
    return this.db.product.create({
      data: {
        ...createProductDto,
        sellerId: sellerId,
      },
    });
  }

  // Upload de CSV
  async uploadCsv(file: Express.Multer.File, sellerId: string) {
    // Validação básica de arquivo
    if (!file || (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv'))) {
      throw new BadRequestException('O arquivo deve ser um CSV');
    }

    const productsToSave: Prisma.ProductCreateManyInput[] = [];
    
    const stream = Readable.from(file.buffer.toString());

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (row) => {
          const product = {
            sellerId: sellerId,
            name: row.nome || row.name,
            description: row.descricao || row.description || '',
            price: parseFloat(row.preco || row.price),
            stockQuantity: parseInt(row.estoque || row.stock || '0'),
            category: this.validateCategory(row.categoria || row.category),
            isPublished: true,
          };

          if (product.name && !isNaN(product.price)) {
             productsToSave.push(product);
          }
        })
        .on('end', async () => {
          try {
            // Se o arquivo estiver vazio, evitamos erro no createMeny
            if (productsToSave.length === 0) {
                return resolve({ message: 'Nenhum produto válido encontrado no CSV', totalInserted: 0 });
            }

            const result = await this.db.product.createMany({
              data: productsToSave,
              skipDuplicates: true, 
            });
            resolve({ message: 'Processamento concluído', totalInserted: result.count });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  private validateCategory(categoryStr: string): ProductCategory {
    if (Object.values(ProductCategory).includes(categoryStr as ProductCategory)) {
      return categoryStr as ProductCategory;
    }
    return ProductCategory.OTHER;
  }
  async getDashboardStats(sellerId: string) {
    // Quantidade de produtos
    const totalProducts = await this.db.product.count({
      where: { sellerId },
    });

    // Faturamento e Total Vendido
    const soldItems = await this.db.orderItem.findMany({
      where: { sellerId },
      select: { quantity: true, unitPrice: true },
    });

    const totalSold = soldItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalRevenue = soldItems.reduce((acc, item) => acc + (Number(item.unitPrice) * item.quantity), 0);

    // Best Seller
    const bestSellerGroup = await this.db.orderItem.groupBy({
      by: ['productId'],
      where: { sellerId },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1,
    });

    let bestSeller: any = null;
    
    if (bestSellerGroup.length > 0) {
      const productId = bestSellerGroup[0].productId;
      const productDetails = await this.db.product.findUnique({
        where: { id: productId },
        include: { images: true },
      });

      if (productDetails) {
        bestSeller = {
          name: productDetails.name,
          totalSold: bestSellerGroup[0]._sum.quantity,
          price: productDetails.price,
          imageUrl: productDetails.images.length > 0 ? productDetails.images[0].url : null,
        };
      }
    }

    return {
      totalProducts,
      totalSold,
      totalRevenue,
      bestSeller,
    };
  }
  async findAll(params: FilterProductDto) {
    const { page = 1, limit = 10, search, category, minPrice, maxPrice } = params;
    
    // Cálculo do Pulo (Pagination)
    // Se estou na pág 1, pulo 0. Se estou na pág 2, pulo 10.
    const skip = (page - 1) * limit;

    // Construção Dinâmica do Filtro (Where)
    const where: any = {
      // Regra base: Só mostra produtos publicados
      isPublished: true, 
      // Se tiver delete lógico (soft delete), adicione: deletedAt: null
    };

    // Filtro de Texto (Busca no Nome OU na Descrição)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }, // insensitive = ignora maiusc/minusc
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro de Categoria
    if (category) {
      where.category = category;
    }

    // Filtro de Preço (Range)
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice; 
    }

    
    const [products, total] = await Promise.all([
      this.db.product.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' }, 
        include: { 
           images: { take: 1 } 
        } 
      }),
      this.db.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }
  findOne(id: string) { return this.db.product.findUnique({ where: { id } }); }

  async addProductImage(productId: string, file: Express.Multer.File) {
    const product = await this.db.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    const imageUrl = await this.storageService.uploadFile(file);
    const savedImage = await this.db.productImage.create({
      data: {
        productId: productId,
        url: imageUrl,
        isMain: false,
      },
    });

    return savedImage;
  }
  async removeProductImage(imageId: string) {
    // A. Busca a imagem no banco para pegar a URL
    const image = await this.db.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    // B. Deleta do S3 (Bucket)
    // Fazemos isso antes de deletar do banco. Se falhar aqui, o banco não muda.
    await this.storageService.deleteFile(image.url);

    // C. Deleta do Banco de Dados
    return this.db.productImage.delete({
      where: { id: imageId },
    });
  }

  // 2. SUBSTITUIR IMAGEM (Editar)
  async replaceProductImage(imageId: string, newFile: Express.Multer.File) {
    // A. Busca a imagem antiga
    const oldImage = await this.db.productImage.findUnique({
      where: { id: imageId },
    });

    if (!oldImage) {
      throw new NotFoundException('Imagem original não encontrada');
    }

    // B. Deleta o arquivo antigo do S3
    await this.storageService.deleteFile(oldImage.url);

    // C. Sobe o arquivo novo
    const newImageUrl = await this.storageService.uploadFile(newFile);

    // D. Atualiza o registro no banco
    return this.db.productImage.update({
      where: { id: imageId },
      data: {
        url: newImageUrl,
      },
    });
  }

}