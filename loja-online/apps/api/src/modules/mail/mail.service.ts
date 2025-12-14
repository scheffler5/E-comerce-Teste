import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    // Pega a chave que você colocou no .env do Render
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendMfaEmail(email: string, code: string) {
    try {
      this.logger.log(`📤 Enviando email via Resend para ${email}...`);

      // OBSERVAÇÃO IMPORTANTE:
      // Sem domínio próprio, o 'from' OBRIGATORIAMENTE tem que ser esse abaixo.
      // O 'to' só pode ser o email que você usou para criar a conta no Resend.
      const data = await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Seu Código de Verificação - Loja Online',
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #000;">Verifique seu acesso</h2>
              <p>Seu código de confirmação é:</p>
              <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <strong style="font-size: 32px; letter-spacing: 5px; color: #333;">${code}</strong>
              </div>
              <p style="color: #666; font-size: 14px;">Válido por 10 minutos.</p>
            </div>
          `,
      });

      this.logger.log(`✅ Email enviado com sucesso! ID: ${data.data?.id}`);
    } catch (error) {
      // Loga o erro mas não derruba a aplicação
      this.logger.error(`❌ Erro no Resend: ${error.message}`, error);
    }
  }
}