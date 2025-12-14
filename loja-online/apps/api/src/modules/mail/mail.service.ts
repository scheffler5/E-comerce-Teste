import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = this.configService.getOrThrow<number>('SMTP_PORT');
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host: host,
      port: Number(port),
      secure: false,
      auth: {
        user: user,
        pass: pass,
      },

      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
    });
  }

  async sendMfaEmail(email: string, code: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"Loja App" <seu_email_real@gmail.com>', // O Gmail exige que o 'from' seja igual ao user autenticado
        to: email,
        subject: 'Seu Código de Verificação - Loja Online',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>Bem-vindo à Loja!</h2>
              <p>Seu código de verificação é:</p>
              <h1 style="color: #2563eb; letter-spacing: 5px;">${code}</h1>
              <p>Este código expira em 10 minutos.</p>
            </div>
          `,
      });
      console.log('✅ Email enviado com sucesso!');
      console.log('🔗 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
    }
  }
}
