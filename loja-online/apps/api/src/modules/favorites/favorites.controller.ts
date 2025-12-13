import { Controller, Post, Get, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common'; 
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  // ParseUUIDPipe garante que o formato enviado na URL é um UUID válido
  async toggle(
    @Param('productId', ParseUUIDPipe) productId: string, 
    @Body() body: { id: string } // Pega o user ID do JSON no corpo da requisição
  ) {
    const userId = body.id; 
    return this.favoritesService.toggleFavorite(userId, productId);
  }

  @Get()
  async findAll(@Body() body: { id: string }) { //Pega o user ID do JSON no corpo da requisição
    const userId = body.id; 
    return this.favoritesService.findAll(userId);
  }
  @Delete(':productId')
  async remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: { id: string } // Pegando o ID do usuário pelo JSON
  ) {
    const userId = body.id;
    return this.favoritesService.remove(userId, productId);
  }
}