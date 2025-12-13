import { Controller, Post, Get, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateDirectOrderDto } from './dto/create-direct-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Finalizar Compra (Checkout)
  @Post('checkout-cart') // Mudei a rota para ficar explícito, se quiser
  async createFromCart(@Body() body: { userId: string }) {
    return this.ordersService.createOrderFromCart(body.userId);
  }

  // NOVO: Comprar Agora (Direto)
  @Post('buy-now')
  async createDirect(@Body() dto: CreateDirectOrderDto) {
    return this.ordersService.createDirectOrder(dto);
  }

  // Ver meus pedidos
  @Get()
  async getHistory(@Body() body: { userId: string }) {
    return this.ordersService.getUserHistory(body.userId);
  }
}