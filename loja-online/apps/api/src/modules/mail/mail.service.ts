import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private apiKey: string;
  private senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('BREVO_API_KEY');

    // MUDANÇA AQUI: Pega o email da variável de ambiente
    // Certifique-se que no Render o valor de SMTP_USER é: gabrischeffler2005@gmail.com
    this.senderEmail = this.configService.getOrThrow<string>('SMTP_USER');
  }

  async sendMfaEmail(email: string, code: string) {
    // Fire & Forget: Chama a função sem await para não travar o cadastro
    this.sendEmailHttp(email, code);
  }

  private async sendEmailHttp(toEmail: string, code: string) {
    const url = 'https://api.brevo.com/v3/smtp/email';

    const body = {
      sender: {
        email: this.senderEmail, // Usa o valor carregado do .env
        name: "Loja Online"
      },
      to: [{ email: toEmail }],
      subject: "Seu Código de Verificação",
      htmlContent: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
           <h2>Loja Online</h2>
           <p>Seu código é:</p>
           <h1 style="color: #2563eb; letter-spacing: 5px;">${code}</h1>
        </div>
      `
    };

    try {
      this.logger.log(`🚀 Enviando de ${this.senderEmail} para ${toEmail} via API...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro API Brevo: ${errorData}`);
      }

      const data = await response.json();
      this.logger.log(`✅ Email enviado com sucesso! MessageId: ${data.messageId}`);

    } catch (error) {
      this.logger.error(`❌ Falha no envio HTTP: ${error.message}`);
    }
  }
}