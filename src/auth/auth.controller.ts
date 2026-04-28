import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto.register';
import { RegisterAdminDto } from './dto.register-admin';
import { VerifyCodeDto } from './dto.verify-code';
import { LoginDto } from './dto.login';
import { ForgotPasswordDto, ResetPasswordDto } from './dto.password';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register-admin')
  registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('verify-phone')
  verifyPhone(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyPhone(dto.phone, dto.code);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.phone, dto.password);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.phone);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.phone, dto.code, dto.newPassword);
  }
}