import { IsUUID, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateDirectOrderDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string; // Mantendo seu padrão de teste

  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}