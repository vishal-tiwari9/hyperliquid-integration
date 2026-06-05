import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AuthController], // Registers our new route controller
  providers: [AuthService],       // Registers our cryptographic logic engine
})
export class AuthModule {}