import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly db: DatabaseService) {}

  async createOrderFromCart(userId: string) {
    // Usamos $transaction para garantir que tudo ocorra ou nada ocorra
    return this.db.$transaction(async (tx) => {
      // Buscar o carrinho do usuário com os produtos e detalhes do vendedor
      const cart = await tx.cart.findUnique({
        where: { clientId: userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('O carrinho está vazio.');
      }

      let totalAmount = 0;
      const orderItemsData = [];

      // Iterar sobre os itens para validar estoque e calcular preços
      for (const item of cart.items) {
        const product = item.product;

        // VALIDAÇÃO DE ESTOQUE
        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto: ${product.name}. Disponível: ${product.stockQuantity}`,
          );
        }

        // CÁLCULO DO PREÇO COM DESCONTO (Lógica de Negócio)
        let finalPrice = Number(product.price);

        if (product.discountValue && product.discountType) {
          if (product.discountType === 'FIXED_AMOUNT') {
            finalPrice -= Number(product.discountValue);
          } else if (product.discountType === 'PERCENTAGE') {
            finalPrice -= finalPrice * (Number(product.discountValue) / 100);
          }
        }
        // Garante que o preço não fique negativo
        finalPrice = Math.max(0, finalPrice);

        // Soma ao total do pedido
        totalAmount += finalPrice * item.quantity;

        // Prepara dados para o OrderItem
        const orderItemsData: {
          productId: string;
          sellerId: string;
          quantity: number;
          unitPrice: number;
        }[] = [];

        // BAIXA DE ESTOQUE
        // Atualiza o produto dentro da transação
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: {
              decrement: item.quantity, // subtrai o valor
            },
          },
        });
      }

      //Criar o Pedido (Order) com os Itens (OrderItems)
      const order = await tx.order.create({
        data: {
          clientId: userId,
          totalAmount: totalAmount,
          status: 'PENDING', // Começa como pendente
          items: {
            create: orderItemsData, // Cria todos os OrderItems de uma vez
          },
        },
        include: {
          items: true, // Retorna os itens criados na resposta
        },
      });

      // Limpar o Carrinho (Já que virou pedido)
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }

  async create(createOrderDto: CreateOrderDto) {
    const { userId, items } = createOrderDto;

    // Rule: Create ONE Order PER Product
    const createdOrders: any[] = [];

    // Use transaction to ensure all orders are created or none
    await this.db.$transaction(async (tx) => {
      for (const item of items) {
        // Create Order
        const order = await tx.order.create({
          data: {
            clientId: userId, // Changed from userId to clientId to match schema
            status: 'PENDING', // Default status
            totalAmount: item.price * item.quantity,
            // Ideally Order schema should have relation to OrderItems
          },
        });

        // Create OrderItem (Just one per order in this logic)
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            sellerId: item.sellerId,
          },
        });

        // Deduct Stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        createdOrders.push(order);
      }

      // Clear Cart after successful order creation
      // Note: In real world, we might only clear items that were ordered.
      // Assuming we are ordering FROM cart, we clear everything for that user.
      // But if we are buying "Single Item" while cart has stuff, we shouldn't clear cart?
      // Let's assume the frontend manages what it sends.
      // If the flow is "Buy from Cart", frontend sends all items.
      // If "Buy Alone", frontend sends 1 item.
      // Backend should probably receive a flag "isCartPurchase" to know if it should clear cart?
      // Or just clear the specific items associated?
      // For simplicity: We will clear the cart items that match the products ordered.

      for (const item of items) {
        await tx.cartItem.deleteMany({
          where: {
            cart: { clientId: userId }, // Changed from userId to clientId to match schema
            productId: item.productId,
          },
        });
      }
    });

    return {
      message: 'Orders created successfully',
      count: createdOrders.length,
    };
  }

  async findAll(userId: string) {
    return this.db.order.findMany({
      where: { clientId: userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Método para listar pedidos do usuário
  async getUserHistory(userId: string) {
    return this.db.order.findMany({
      where: {
        clientId: userId,
      },
      include: {
        items: {
          include: {
            product: true, // Traz nome, descrição e imagens do produto
            seller: {
              // Traz o nome de quem vendeu
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', //Mostra as compras mais recentes primeiro
      },
    });
  }
  async createDirectOrder(dto: {
    userId: string;
    productId: string;
    quantity: number;
  }) {
    return this.db.$transaction(async (tx) => {
      // Buscar o Produto e validar existência
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Validação de Estoque
      if (product.stockQuantity < dto.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${product.stockQuantity}`,
        );
      }

      // Cálculo do Preço (Reutilizando a lógica de descontos)
      let finalPrice = Number(product.price);

      if (product.discountValue && product.discountType) {
        if (product.discountType === 'FIXED_AMOUNT') {
          finalPrice -= Number(product.discountValue);
        } else if (product.discountType === 'PERCENTAGE') {
          finalPrice -= finalPrice * (Number(product.discountValue) / 100);
        }
      }
      finalPrice = Math.max(0, finalPrice);

      // Calcular Total do Pedido
      const totalAmount = finalPrice * dto.quantity;

      // Baixar Estoque
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: {
            decrement: dto.quantity,
          },
        },
      });

      // Criar o Pedido
      const order = await tx.order.create({
        data: {
          clientId: dto.userId,
          totalAmount: totalAmount,
          status: 'PENDING',
          items: {
            create: [
              {
                productId: product.id,
                sellerId: product.sellerId,
                quantity: dto.quantity,
                unitPrice: finalPrice,
              },
            ],
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    });
  }
}
