import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('AWS_BUCKET_NAME');
    const region = this.configService.getOrThrow<string>('AWS_REGION');
    const accessKeyId =
      this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

    this.s3Client = new S3Client({
      region: region,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error) {
      console.log(
        `Bucket ${this.bucketName} não encontrado. Criando automaticamente...`,
      );
      await this.s3Client.send(
        new CreateBucketCommand({ Bucket: this.bucketName }),
      );
      console.log(`Bucket criado!`);
    }
  }
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // 1. Envia o arquivo (Funciona igual para AWS, Supabase ou LocalStack)
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Nota: O Supabase ignora isso, você configura no painel dele
      }),
    );

    // 2. Gera a URL correta dependendo do provedor
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    let fileUrl: string;

    if (!endpoint) {
      // Se NÃO tem endpoint, assume que é Amazon S3 original
      fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
    } else if (endpoint.includes('supabase.co')) {
      // ✅ SE FOR SUPABASE: Ajusta a URL de visualização
      // O endpoint de upload é ".../storage/v1/s3"
      // A URL pública é ".../storage/v1/object/public"
      const publicUrlBase = endpoint.replace('/s3', '/object/public');
      fileUrl = `${publicUrlBase}/${this.bucketName}/${fileName}`;
    } else {
      // Outros (LocalStack, MinIO, etc)
      fileUrl = `${endpoint}/${this.bucketName}/${fileName}`;
    }

    return fileUrl;
  }
  async deleteFile(fileUrl: string): Promise<void> {
    const urlParts = fileUrl.split('/');
    const fileName = urlParts.pop();
    if (!fileName) return;
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      }),
    );
  }
}
