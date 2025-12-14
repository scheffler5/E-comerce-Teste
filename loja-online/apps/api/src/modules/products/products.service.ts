import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { ProductCategory, Prisma } from '@prisma/client';
import { FilterProductDto } from './dto/filter-product.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storageService: StorageService,
  ) { }

  // Manual Creation
  async create(createProductDto: CreateProductDto, sellerId: string) {
    return this.db.product.create({
      data: {
        ...createProductDto,
        sellerId: sellerId,
      },
    });
  }

  // Update Product
  async update(id: string, updateProductDto: any) {
    // Check if product exists
    return this.db.product.update({
      where: { id },
      data: updateProductDto
    });
  }

  // CSV Upload
  async uploadCsv(file: Express.Multer.File, sellerId: string) {
    // Basic file validation
    if (
      !file ||
      (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv'))
    ) {
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
            // Avoid error on empty file
            if (productsToSave.length === 0) {
              return resolve({
                message: 'Nenhum produto válido encontrado no CSV',
                totalInserted: 0,
              });
            }

            const result = await this.db.product.createMany({
              data: productsToSave,
              skipDuplicates: true,
            });
            resolve({
              message: 'Processamento concluído',
              totalInserted: result.count,
            });
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
    if (
      Object.values(ProductCategory).includes(categoryStr as ProductCategory)
    ) {
      return categoryStr as ProductCategory;
    }
    return ProductCategory.OTHER;
  }
  async getDashboardStats(sellerId: string) {
    console.log(`[DEBUG] getDashboardStats for sellerId: ${sellerId}`);

    // Quantidade de produtos
    const totalProducts = await this.db.product.count({
      where: { sellerId },
    });
    console.log(`[DEBUG] totalProducts found: ${totalProducts}`);

    // Faturamento e Total Vendido
    const soldItems = await this.db.orderItem.findMany({
      where: { sellerId },
      select: { quantity: true, unitPrice: true },
    });

    const totalSold = soldItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalRevenue = soldItems.reduce(
      (acc, item) => acc + Number(item.unitPrice) * item.quantity,
      0,
    );

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
          id: productDetails.id, // Needed for link
          name: productDetails.name,
          totalSold: bestSellerGroup[0]._sum.quantity,
          price: productDetails.price,
          imageUrl:
            productDetails.images.length > 0
              ? productDetails.images[0].url
              : null,
          discountValue: productDetails.discountValue,
          discountType: productDetails.discountType
        };
      }
    }

    // Revenue History (6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueItems = await this.db.orderItem.findMany({
      where: {
        sellerId,
        order: {
          createdAt: { gte: sixMonthsAgo }
        }
      },
      select: {
        unitPrice: true,
        quantity: true,
        order: {
          select: { createdAt: true }
        }
      },
    });

    const revenueMap: Record<string, number> = {};

    // Initialize history
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueMap[key] = 0;
    }

    revenueItems.forEach(item => {
      const date = item.order.createdAt;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (revenueMap[key] !== undefined) {
        revenueMap[key] += Number(item.unitPrice) * item.quantity;
      }
    });

    const revenueHistory = Object.entries(revenueMap).map(([date, revenue]) => ({
      date, // YYYY-MM
      revenue
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      sellerIdDebug: sellerId,
      totalProducts,
      totalSold,
      totalRevenue,
      bestSeller,
      revenueHistory
    };
  }

  async findBestSellers(limit: number) {
    const bestSellerGroup = await this.db.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    if (bestSellerGroup.length === 0) return [];

    const productIds = bestSellerGroup.map((g) => g.productId);

    // Fetch product details
    const products = await this.db.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
      include: { images: { take: 1 } },
    });

    // Map back to preserve order or add 'sold' count if needed
    return products;
  }

  async findBestOffers(limit: number) {
    // Filter by products that HAVE a discount
    return this.db.product.findMany({
      where: {
        isPublished: true,
        discountValue: { not: null }, // Must have a discount
      },
      orderBy: { discountValue: 'desc' }, // Higher discount value = "Better" offer (simplification)
      take: limit,
      include: { images: { take: 1 } },
    });
  }
  async findAll(params: FilterProductDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
      sellerId,
    } = params;

    // Cálculo do Pulo (Pagination)
    // Se estou na pág 1, pulo 0. Se estou na pág 2, pulo 10.
    const skip = (page - 1) * limit;

    // Dynamic Filter Construction
    const where: any = {
      // Base rule: Published only
      isPublished: true,
    };

    if (sellerId) {
      where.sellerId = sellerId;
    }

    // Text Filter
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

    // Dynamic Sorting
    let orderBy: any = { createdAt: 'desc' }; // Default
    if (params.sortBy) {
      if (params.sortBy === 'discount_desc') {
        orderBy = { discountValue: 'desc' };
        where.discountValue = { not: null };
      } else if (params.sortBy === 'price_asc') {
        orderBy = { price: 'asc' };
      } else if (params.sortBy === 'price_desc') {
        orderBy = { price: 'desc' };
      }
    }

    const [products, total] = await Promise.all([
      this.db.product.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include: {
          images: { take: 1 },
        },
      }),
      this.db.product.count({ where }),
    ]);

    // Calculate 6-month sales history
    const productIds = products.map(p => p.id);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orderItems = await this.db.orderItem.findMany({
      where: {
        productId: { in: productIds },
        order: { createdAt: { gte: sixMonthsAgo } }
      },
      select: {
        productId: true,
        quantity: true,
        unitPrice: true,
        order: { select: { createdAt: true } }
      }
    });

    const productsWithStats = products.map(product => {
      const productSales = orderItems.filter(item => item.productId === product.id);

      const revenueMap: Record<string, number> = {};

      // Initialize last 6 months with 0
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        revenueMap[key] = 0;
      }

      productSales.forEach(item => {
        const date = item.order.createdAt;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (revenueMap[key] !== undefined) {
          revenueMap[key] += Number(item.unitPrice) * item.quantity;
        }
      });

      const salesHistory = Object.entries(revenueMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...product,
        salesHistory
      };
    });

    return {
      data: productsWithStats,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }
  findOne(id: string) {
    return this.db.product.findUnique({
      where: { id },
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async addProductImage(productId: string, file: Express.Multer.File) {
    const product = await this.db.product.findUnique({
      where: { id: productId },
    });
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

  // Replace Image
  async replaceProductImage(imageId: string, newFile: Express.Multer.File) {
    // Find old image
    const oldImage = await this.db.productImage.findUnique({
      where: { id: imageId },
    });

    if (!oldImage) {
      throw new NotFoundException('Imagem original não encontrada');
    }

    // Delete old S3 file
    await this.storageService.deleteFile(oldImage.url);

    // Upload new file
    const newImageUrl = await this.storageService.uploadFile(newFile);

    // Update DB record
    return this.db.productImage.update({
      where: { id: imageId },
      data: {
        url: newImageUrl,
      },
    });
  }
}
