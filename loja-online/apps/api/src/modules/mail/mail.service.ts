import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      service: 'gmail', // <--- O SEGREDO: Isso configura host e porta automaticamente
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        rejectUnauthorized: false, // Ajuda a não travar no Render
      },
    });
  }

  async sendMfaEmail(email: string, code: string) {
    // Definimos o remetente aqui
    const fromUser = this.configService.get<string>('SMTP_USER');

    const mailOptions = {
      from: `"Loja Online" <${fromUser}>`,
      to: email,
      subject: 'Seu Código de Verificação',
      html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #4F46E5;">Loja Online</h2>
            <p>Seu código de acesso é:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center;">
              <h1 style="color: #2563eb; letter-spacing: 5px; margin: 0;">${code}</h1>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Este código expira em 10 minutos.</p>
          </div>
        `,
    };

    // Tenta enviar. Se der erro, loga mas não derruba a aplicação.
    try {
      this.logger.log(`📤 Tentando enviar email para ${email}...`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email enviado! ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`❌ Falha no envio para ${email}: ${error.message}`);
      // NÃO damos throw error aqui. Se falhar, o log avisa, mas o usuário não trava.
    }
  }
}