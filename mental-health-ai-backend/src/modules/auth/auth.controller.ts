import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  HttpException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, GoogleLoginRequest } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Public } from '../../common/decorators';
import type { Request, Response } from 'express';

type RequestWithCookies = Request & { cookies?: { refreshToken?: string } };
type RequestWithUser = Request & { user?: { userId?: string } };

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/v1/auth',
    });
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    if (result?.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }
    return result;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request & GoogleLoginRequest,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      const result = await this.authService.googleLogin(req);
      if (result?.refreshToken) {
        this.setRefreshTokenCookie(res, result.refreshToken);
      }

      res.redirect(
        `${frontendUrl}/login/success?token=${result.accessToken}&isNewUser=${result.isNewUser}`,
      );
    } catch (error: unknown) {
      let errorMessage = 'Google authentication failed';

      if (error instanceof HttpException) {
        const response = error.getResponse() as
          | string
          | { EM?: string; message?: string | string[] };

        if (typeof response === 'string') {
          errorMessage = response;
        } else if (response?.EM) {
          errorMessage = response.EM;
        } else if (Array.isArray(response?.message)) {
          errorMessage = response.message.join(', ');
        } else if (typeof response?.message === 'string') {
          errorMessage = response.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const encodedError = encodeURIComponent(errorMessage);
      res.redirect(`${frontendUrl}/auth/login?googleError=${encodedError}`);
    }
  }

  @Get('refresh-token')
  async refreshToken(@Req() req: RequestWithCookies) {
    const refreshToken = req.cookies?.refreshToken || '';
    const result = await this.authService.refreshAccessToken(refreshToken);
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshTokenCookie(res);
    return { EC: 1, EM: 'Logout successful' };
  }

  @Get('account')
  @UseGuards(AuthGuard('jwt'))
  async fetchAccount(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    return this.authService.getAccountById(userId || '');
  }
}
