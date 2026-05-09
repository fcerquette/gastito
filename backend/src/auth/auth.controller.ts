import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { User } from '../common/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  /** Inicia el flujo de Google OAuth */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport hace redirect a Google
  }

  /** Callback de Google después del login */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as any;
    const user = await this.authService.findOrCreateFromGoogle(profile);
    const token = this.authService.signToken(user);

    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.config.get<string>('COOKIE_DOMAIN') || undefined;

    res.cookie('gastito_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      domain: cookieDomain,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    res.redirect(`${frontendUrl}/login/success`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
    };
  }

  @Post('logout')
  logout(@Res() res: Response) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.clearCookie('gastito_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
    res.json({ ok: true });
  }
}
