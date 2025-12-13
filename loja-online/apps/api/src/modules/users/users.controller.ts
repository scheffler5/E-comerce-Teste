import { Controller, Get, Post, Body, Patch,UseInterceptors,UploadedFile,ParseUUIDPipe, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) { 
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) { 
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { 
    return this.usersService.remove(id);
  }
  @Patch(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(id, file);
  }

  // DELETAR FOTO DE PERFIL
  @Delete(':id/avatar')
  async removeAvatar(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.removeAvatar(id);
  }
  @Post('register')
  async register(@Body() body: { name: string; email: string; password: string; string; role?: 'CLIENT' | 'SELLER' }) {
    const fakeHash = `hash-${body.password}`;
    return this.usersService.register({ 
        name: body.name, 
        email: body.email, 
        passwordHash: fakeHash,
        role: body.role
    });
  }
  @Post('verify')
  async verify(@Body() body: { email: string; code: string }) {
    return this.usersService.verifyMfa(body.email, body.code);
  }
}