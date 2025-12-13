import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly db: DatabaseService) {}

  // 1. Adicionar Item (ou incrementar se já existir)
  async addToCart(dto: AddToCartDto) {
    // A. Garante que o carrinho existe
    const cart = await this.getOrCreateCart(dto.userId);

    // B. Verifica se esse produto JÁ está no carrinho
    const existingItem = await this.db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
      },
    });

    if (existingItem) {
      // C. Se existe, apenas atualiza a quantidade (soma a nova qtde)
      return this.db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    }

    // D. Se não existe, cria um novo item
    return this.db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });
  }

  // 2. Consultar o Carrinho (Lista itens e produtos)
  async getCart(userId: string) {
    const cart = await this.db.cart.findUnique({
      where: { clientId: userId }, // Atenção: Seu schema usa 'clientId'
      include: {
        items: {
          include: {
            product: true, // Traz os detalhes do produto (nome, preço)
          },
          orderBy: {
            id: 'asc' // Ordena items por ordem de inserção
          }
        },
      },
    });

    if (!cart) {
        // Se não tiver carrinho, retorna array vazio ou objeto vazio
        return { items: [] }; 
    }

    return cart;
  }

  // 3. Remover Item do Carrinho
  async removeItem(itemId: string) {
    // Verifica se o item existe antes de tentar deletar
    const item = await this.db.cartItem.findUnique({
        where: { id: itemId }
    });

    if (!item) {
        throw new NotFoundException('Item não encontrado no carrinho');
    }

    // Deleta do banco
    return this.db.cartItem.delete({
      where: { id: itemId },
    });
  }

  // --- Método Auxiliar Privado ---
  private async getOrCreateCart(userId: string) {
    let cart = await this.db.cart.findUnique({
      where: { clientId: userId },
    });

    if (!cart) {
      cart = await this.db.cart.create({
        data: { clientId: userId },
      });
    }
    return cart;
  }
}