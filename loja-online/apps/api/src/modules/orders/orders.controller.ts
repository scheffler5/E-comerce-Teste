import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateDirectOrderDto } from './dto/create-direct-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  // Finalizar Compra (Checkout)
  @Post('checkout-cart')
  async createFromCart(@Body() body: { userId: string }) {
    return this.ordersService.createOrderFromCart(body.userId);
  }

  // NOVO: Comprar Agora (Direto)
  @Post('buy-now')
  async createDirect(@Body() dto: CreateDirectOrderDto) {
    return this.ordersService.createDirectOrder(dto);
  }

  // Get all orders for a user (or potentially all if admin)
  @Get()
  findAll(@Query('userId') userId: string) {
    if (!userId) {
      // If admin, maybe return all? For now, require userId
      throw new BadRequestException('UserId required');
    }
    return this.ordersService.findAll(userId);
  }
}
