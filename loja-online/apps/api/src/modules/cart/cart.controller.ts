import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  Patch,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Adicionar item ao carrinho
  @Post()
  async addItem(@Body() dto: AddToCartDto) {
    return this.cartService.addToCart(dto);
  }

  // Consultar carrinho
  @Get()
  async getCart(@Query('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  // Remover item do carrinho
  // DELETE /cart/:itemId
  @Delete(':itemId')
  async removeItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.cartService.removeItem(itemId);
  }

  // Atualizar Quantidade
  // PATCH /cart/:itemId
  @Patch(':itemId')
  async updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateItem(itemId, quantity);
  }
}
