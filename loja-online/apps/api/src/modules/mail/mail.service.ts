import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('SMTP_HOST'),
      port: Number(this.configService.getOrThrow('SMTP_PORT')),
      secure: false,
      auth: {
        user: this.configService.getOrThrow('SMTP_USER'),
        pass: this.configService.getOrThrow('SMTP_PASS'),
      },
      // 👇 ADICIONE ISTO AQUI! É O QUE CONSERTA O TIMEOUT NO RENDER
      family: 4,
      tls: {
        rejectUnauthorized: false,
      },
    } as any);
  }

  async sendMfaEmail(email: string, code: string) {
    // Atenção: Use aqui o email que você validou no Brevo
    // Se o seu SMTP_USER for o email validado, pode usar ele
    const fromUser = this.configService.getOrThrow<string>('SMTP_USER');

    // Fire & Forget (sem await para não travar o cadastro)
    this.sendMailInBackground(fromUser, email, code);
  }

  private async sendMailInBackground(from: string, to: string, code: string) {
    try {
      this.logger.log(`🚀 (IPv4) Enviando via Brevo para ${to}...`);

      const info = await this.transporter.sendMail({
        from: `"Loja Online" <${from}>`,
        to: to,
        subject: 'Seu Código de Verificação',
        html: `
           <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
             <h2>Loja Online</h2>
             <p>Seu código é:</p>
             <h1 style="color: #2563eb; letter-spacing: 5px;">${code}</h1>
           </div>
        `,
      });

      this.logger.log(`✅ Email enviado! ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`❌ Erro Brevo: ${error.message}`);
    }
  }
}