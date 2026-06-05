import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth') // This exposes http://localhost:3001/api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google-handshake')
  @HttpCode(HttpStatus.OK) // Sets standard 200 OK status for Postman
  async handshake(@Body() body: { idToken: string }) {
    // This delegates the request token payload directly to our service layer
    return this.authService.executeGoogleAuthFlow(body.idToken);
  }
}