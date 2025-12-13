import { Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
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
  // Como é GET, estou usando @Body para teste, mas lembre que em GET body não é padrão
  @Get()
  async getCart(@Body() body: { userId: string }) {
    return this.cartService.getCart(body.userId);
  }

  // Remover item do carrinho
  // DELETE /cart/:itemId
  @Delete(':itemId')
  async removeItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.cartService.removeItem(itemId);
}
}