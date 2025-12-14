import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: { identifier: string; password: string }) {
    return this.authService.login(loginDto);
  }

  @Get('ping')
  ping() {
    return 'pong';
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-code')
  verifyCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyMfa(body.email, body.code);
  }

  @Post('reset-password')
  resetPassword(
    @Body() body: { email: string; code: string; newPass: string },
  ) {
    return this.authService.resetPassword(body.email, body.code, body.newPass);
  }

  @Post('register')
  register(
    @Body() body: { name: string; email: string; role: 'CLIENT' | 'SELLER' },
  ) {
    return this.authService.register(body);
  }

  @Post('register-complete')
  completeRegistration(
    @Body() body: { email: string; code: string; newPass: string },
  ) {
    return this.authService.completeRegistration(
      body.email,
      body.code,
      body.newPass,
    );
  }

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
