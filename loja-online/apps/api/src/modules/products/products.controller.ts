import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseInterceptors,
  ParseUUIDPipe,
  UploadedFile,
  Query,
  Header,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  // Criação Manual
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @Query('sellerId') sellerId: string,
  ) {
    return this.productsService.create(createProductDto, sellerId);
  }

  // Upload CSV
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('sellerId') sellerId: string,
  ) {
    return this.productsService.uploadCsv(file, sellerId);
  }

  @Get()
  findAll(@Query() filterDto: FilterProductDto) {
    return this.productsService.findAll(filterDto);
  }

  @Get('best-sellers')
  findBestSellers(@Query('limit') limit: string) {
    const limitNum = limit ? parseInt(limit) : 4; // Default to 4
    return this.productsService.findBestSellers(limitNum);
  }

  @Get('best-offers')
  findBestOffers(@Query('limit') limit: string) {
    const limitNum = limit ? parseInt(limit) : 4; // Default to 4
    return this.productsService.findBestOffers(limitNum);
  }

  @Get('dashboard')
  @Header('Cache-Control', 'no-store')
  async getDashboardStats(@Query('sellerId') sellerId: string) {
    if (!sellerId) {
      throw new BadRequestException('Seller ID is required');
    }
    return this.productsService.getDashboardStats(sellerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: any) { // Using standard body
    return this.productsService.update(id, updateProductDto);
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
