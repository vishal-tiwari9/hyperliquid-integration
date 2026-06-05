import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import core nest config loader
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    // Registers and forces system to load environment keys before services boot
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: ['.env', '../../.env'], // Smart resolution: check local API env first, fallback to root env
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}