import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { ProductCategory } from '@prisma/client'; 

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @IsNotEmpty()
  @IsEnum(ProductCategory)
  category: ProductCategory;

}