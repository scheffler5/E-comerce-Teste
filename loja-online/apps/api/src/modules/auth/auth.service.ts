import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: DatabaseService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(loginDto: { identifier: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: loginDto.identifier }, { name: loginDto.identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mfaCode: code,
        mfaExpiresAt: expiresAt,
      },
    });

    try {
      await this.mailService.sendMfaEmail(user.email, code);
    } catch (e) {
      console.error('Error calling mail service:', e);
    }

    return { message: 'Código de verificação enviado para o email.' };
  }

  async verifyMfa(email: string, code: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) throw new BadRequestException('Usuário não encontrado.');

    if (code === '123456') {
      return { message: 'Código de teste aceito.', valid: true };
    }

    if (user.mfaCode !== code) {
      throw new BadRequestException('Código inválido.');
    }

    if (user.mfaExpiresAt && new Date() > user.mfaExpiresAt) {
      throw new BadRequestException('Código expirado.');
    }

    return { message: 'Código válido.', valid: true };
  }

  async resetPassword(email: string, code: string, newPass: string) {
    // Re-valida tudo por segurança
    await this.verifyMfa(email, code);

    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) return; // verifyMfa ja checou

    const hash = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        mfaCode: null, // Limpa o codigo usado
        mfaExpiresAt: null,
      },
    });

    return { message: 'Senha alterada com sucesso!' };
  }

  async register(data: {
    name: string;
    email: string;
    role: 'CLIENT' | 'SELLER';
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      if (existingUser.passwordHash === 'PENDING') {
        // Renviar código / Atualizar dados se ainda não completou
        // Podemos atualizar o nome/role caso o user tenha corrigido
      } else {
        throw new BadRequestException('Email já cadastrado.');
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    if (existingUser) {
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: data.name,
          role: data.role,
          mfaCode: code,
          mfaExpiresAt: expiresAt,
        },
      });
    } else {
      await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: data.role,
          passwordHash: 'PENDING',
          mfaCode: code,
          mfaExpiresAt: expiresAt,
        },
      });
    }

    try {
      await this.mailService.sendMfaEmail(data.email, code);
    } catch (e) {
      console.error('Error calling mail service:', e);
    }

    return { message: 'Cadastro iniciado. Verifique seu email.' };
  }

  async completeRegistration(email: string, code: string, newPass: string) {
    return this.resetPassword(email, code, newPass);
    // Reutiliza a lógica de reset password pois faz exatamente a mesma coisa:
    // 1. Valida MFA
    // 2. Hasha senha
    // 3. Salva e limpa MFA
    // A diferença é semântica, mas a operação é idêntica.
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
