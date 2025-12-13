import { Controller, Get, Post, Body, Patch, Put,Param, Delete, UseInterceptors, ParseUUIDPipe, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Criação Manual
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Query('sellerId') sellerId: string) {
    return this.productsService.create(createProductDto, sellerId);
  }

  // Upload CSV
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) 
  uploadCsv(
    @UploadedFile() file: Express.Multer.File, 
    @Query('sellerId') sellerId: string
  ) {
    return this.productsService.uploadCsv(file, sellerId);
  }

  @Get()
  findAll(@Query() filterDto: FilterProductDto) { 
    return this.productsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
  @Get('dashboard')
  getDashboard(@Query('sellerId') sellerId: string) {
    if (!sellerId) {
      // Simples validação manual enquanto não temos Auth Guard
      throw new Error('Seller ID is required'); 
    }
    return this.productsService.getDashboardStats(sellerId);
  }
  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file')) // 'file' é o nome do campo no Insomnia
  async uploadImage(
    @Param('id', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.addProductImage(productId, file);
  }
  @Put('images/:imageId')
  @UseInterceptors(FileInterceptor('file'))
  async replaceImage(
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.replaceProductImage(imageId, file);
  }

  // DELETAR IMAGEM
  // DELETE /products/images/:imageId
  @Delete('images/:imageId')
  async removeImage(@Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.productsService.removeProductImage(imageId);
  }
}