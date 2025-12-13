import { Injectable, ConflictException, NotFoundException,BadRequestException } from '@nestjs/common';
import { CreateUserDto, Role } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service'; // Importe o serviço criado acima
import { randomInt } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
  ) {} 

  async create(createUserDto: CreateUserDto) {
    // 1. Verificar se email já existe
    const userExists = await this.db.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (userExists) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    // 3. Criar no Banco
    const user = await this.db.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: passwordHash,
        role: createUserDto.role,
      },
    });

    // 4. Retornar sem a senha 
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll() {
    // Retorna todos os usuários que nao foram excluidos
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
      }
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
    // Verifica se usuário existe antes de tentar atualizar
    await this.findOne(id);

    const dataToUpdate: any = { ...updateUserDto };

    // Se a senha foi enviada, é preciso  criptografar de novo
    if (dataToUpdate.password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.passwordHash = await bcrypt.hash(dataToUpdate.password, salt);
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
  async register(data: { name: string; email: string; passwordHash: string; role?: 'CLIENT' | 'SELLER' }) {
    // Verifica se o email já existe
    const existingUser = await this.db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    //  Gera Código de 6 dígitos
    const code = randomInt(100000, 999999).toString();

    // Calcula Expiração 
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Cria o usuário (como INATIVO ou apenas salva o MFA)
    const user = await this.db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role || 'CLIENT', // <--- Se vier nulo, usa CLIENT
      mfaCode: code,
      mfaExpiresAt: expiresAt,
      isActive: false, 
    },
  });

    // Envia o E-mail (Assíncrono, não trava a resposta)
    this.mailService.sendMfaEmail(user.email, code);

    return { 
      message: 'Usuário criado. Verifique seu e-mail para o código de ativação.',
      userId: user.id 
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
      throw new BadRequestException('O código expirou ou é inválido. Solicite um novo.');
    }

    //  SUCESSO: Ativa o usuário e limpa o código
    await this.db.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        mfaCode: null,      // Limpa para não ser usado de novo
        mfaExpiresAt: null,
      },
    });

    return { message: 'Conta verificada com sucesso!' };
  }
}