import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = this.configService.getOrThrow<number>('SMTP_PORT');
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host: host, // Certifique-se que no .env o valor é 'smtp.gmail.com'
      port: Number(port), // 587
      secure: true, // true para 465, false para outras portas
      auth: {
        user: user,
        pass: pass,
      },
      tls: {
        // O Gmail moderno não aceita SSLv3. Removemos aquela linha.
        // rejectUnauthorized: false ajuda a evitar erros de certificado em desenvolvimento, 
        // mas o ideal em produção é remover essa linha tls inteira se possível.
        rejectUnauthorized: false,
      },
    });
  }

  async sendMfaEmail(email: string, code: string) {
    try {
      const fromUser = this.configService.get<string>('SMTP_USER');

      const info = await this.transporter.sendMail({
        // O Gmail exige que o 'from' seja igual ao usuário autenticado ou um alias verificado
        from: `"Loja Online" <${fromUser}>`,
        to: email,
        subject: 'Seu Código de Verificação - Loja Online',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #4F46E5;">Bem-vindo à Loja!</h2>
              <p>Seu código de verificação é:</p>
              <div style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; display: inline-block;">
                <h1 style="color: #2563eb; letter-spacing: 5px; margin: 0;">${code}</h1>
              </div>
              <p>Este código expira em 10 minutos.</p>
              <p style="font-size: 12px; color: #666;">Se você não solicitou este código, ignore este e-mail.</p>
            </div>
          `,
      });

      this.logger.log(`✅ Email enviado para ${email}. ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error('❌ Erro ao enviar email:', error);
      throw error; // É bom lançar o erro para quem chamou saber que falhou
    }
  }
}