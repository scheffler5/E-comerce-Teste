import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('SMTP_HOST'), // smtp-relay.brevo.com
      port: this.configService.getOrThrow('SMTP_PORT'), // 587
      secure: false, // Porta 587 exige false
      auth: {
        user: this.configService.getOrThrow('SMTP_USER'), // Seu login do Brevo
        pass: this.configService.getOrThrow('SMTP_PASS'), // Sua senha do Brevo
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendMfaEmail(email: string, code: string) {
    // IMPORTANTE: O 'from' deve ser um email validado na sua conta Brevo
    // Se você validou seu gmail lá, use ele.
    const fromUser = "seu_email_validado_no_brevo@gmail.com";

    this.sendMailInBackground(fromUser, email, code);
  }

  private async sendMailInBackground(from: string, to: string, code: string) {
    try {
      this.logger.log(`🚀 Enviando via Brevo para ${to}...`);
      await this.transporter.sendMail({
        from: `"Loja Online" <${from}>`,
        to: to,
        subject: 'Seu Código de Verificação',
        html: `<p>Seu código é: <b>${code}</b></p>`,
      });
      this.logger.log(`✅ Email enviado!`);
    } catch (error) {
      this.logger.error(`❌ Erro Brevo: ${error.message}`);
    }
  }
}