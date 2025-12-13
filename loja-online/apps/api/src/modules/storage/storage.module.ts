import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService], // Exportamos para o ProductsModule poder usar
})
export class StorageModule {}