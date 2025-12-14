import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto, Role } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service'; // Importe o serviço criado acima
import { randomInt } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    // Check if email exists
    const userExists = await this.db.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (userExists) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    // Create User
    const user = await this.db.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: passwordHash,
        role: createUserDto.role,
      },
    });

    // Return without password
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll() {
    // Returns all non-deleted users
    const users = await this.db.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    // Se não achar ou se já estiver deletado, erro 404
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verify user existence before update
    await this.findOne(id);

    const dataToUpdate: any = { ...updateUserDto };

    // Re-hash password if provided
    if (dataToUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.passwordHash = await bcrypt.hash(
        dataToUpdate.password,
        salt,
      );
      delete dataToUpdate.password;
    }

    const user = await this.db.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async remove(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // CLIENTE
    if (user.role === Role.CLIENT) {
      // histórico mantido, mas conta inacessível
      return this.db.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    // VENDEDOR
    if (user.role === Role.SELLER) {
      // Vendedores são apenas desativados
      return this.db.user.update({
        where: { id },
        data: { isActive: false },
      });
    }
  }

  // Deactivate seller and hide products
  async deactivateSeller(id: string) {
    return this.db.$transaction(async (tx) => {
      // Deactivate User
      const user = await tx.user.update({
        where: { id },
        data: { isActive: false },
      });

      // Hide Products
      await tx.product.updateMany({
        where: { sellerId: id },
        data: { isPublished: false },
      });

      return user;
    });
  }
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Se o usuário JÁ tem um avatar, deletamos o antigo do S3 primeiro
    if (user.avatarUrl) {
      await this.storageService.deleteFile(user.avatarUrl);
    }

    // Faz o upload da nova imagem
    const newAvatarUrl = await this.storageService.uploadFile(file);

    // Atualiza o banco
    return this.db.user.update({
      where: { id: userId },
      data: {
        avatarUrl: newAvatarUrl,
      },
    });
  }

  // REMOVER AVATAR
  async removeAvatar(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Só tenta deletar se existir URL
    if (user.avatarUrl) {
      await this.storageService.deleteFile(user.avatarUrl);
    }

    // Define como NULL no banco
    return this.db.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
      },
    });
  }
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: 'CLIENT' | 'SELLER';
  }) {
    // Check for existing email
    const existingUser = await this.db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    // Generate 6-digit code
    const code = randomInt(100000, 999999).toString();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create inactive user
    const user = await this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: passwordHash,
        role: data.role || 'CLIENT', // <--- Se vier nulo, usa CLIENT
        mfaCode: code,
        mfaExpiresAt: expiresAt,
        isActive: false,
      },
    });

    // Envia o E-mail (Assíncrono, não trava a resposta)
    this.mailService.sendMfaEmail(user.email, code);

    return {
      message:
        'Usuário criado. Verifique seu e-mail para o código de ativação.',
      userId: user.id,
    };
  }

  // VALIDAÇÃO DO CÓDIGO MFA
  async verifyMfa(email: string, code: string) {
    // A. Busca usuário
    const user = await this.db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    //  Verifica se já está ativo (opcional)
    if (user.isActive && !user.mfaCode) {
      return { message: 'Usuário já verificado anteriormente.' };
    }

    //  Valida se o código bate
    if (user.mfaCode !== code) {
      throw new BadRequestException('Código inválido.');
    }

    //  Valida se expirou
    if (!user.mfaExpiresAt || new Date() > user.mfaExpiresAt) {
      throw new BadRequestException(
        'O código expirou ou é inválido. Solicite um novo.',
      );
    }

    //  SUCESSO: Ativa o usuário e limpa o código
    await this.db.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        mfaCode: null, // Limpa para não ser usado de novo
        mfaExpiresAt: null,
      },
    });

    return { message: 'Conta verificada com sucesso!' };
  }
  // List Sellers
  async findSellers() {
    const sellers = await this.db.user.findMany({
      where: {
        role: Role.SELLER,
        isActive: true, // Active only
        deletedAt: null,
      },
      include: {
        products: {
          where: { stockQuantity: { gt: 0 } }, // Apenas com produtos em estoque para estatística
          select: { category: true },
        },
      },
    });

    // Transform data to include stats
    return sellers.map((seller) => {
      const productCount = seller.products.length;

      // Calculate Top Categories
      const categoryCounts = seller.products.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

      const { passwordHash, products, ...sellerData } = seller;

      return {
        ...sellerData,
        productCount,
        topCategories,
      };
    });
  }
}
