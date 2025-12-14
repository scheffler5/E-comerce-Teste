import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly db: DatabaseService) {} // Injeção correta

  async toggleFavorite(userId: string, productId: string) {
    // 1. Verifica se já existe usando a chave composta
    const existing = await this.db.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await this.db.favorite.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      return { message: 'Produto removido dos favoritos', active: false };
    }

    // 3. Cria se não existir
    await this.db.favorite.create({
      data: { userId, productId },
    });
    return { message: 'Produto adicionado aos favoritos', active: true };
  }

  async findAll(userId: string) {
    const favorites = await this.db.favorite.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    return favorites.map((fav) => fav.product);
  }

  async remove(userId: string, productId: string) {
    const favorite = await this.db.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new Error('Este produto não está nos favoritos.');
    }

    await this.db.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return { message: 'Favorito removido com sucesso' };
  }
}
