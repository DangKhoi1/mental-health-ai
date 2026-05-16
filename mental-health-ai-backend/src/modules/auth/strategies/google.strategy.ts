import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:8000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  authorizationParams(): { prompt: string } {
    return {
      prompt: 'select_account',
    };
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails, photos, id } = profile;

    const user = {
      email: emails?.[0]?.value,
      fullName:
        profile.displayName ||
        `${name?.familyName || ''} ${name?.givenName || ''}`.trim(),
      avatarUrl: photos?.[0]?.value,
      providerId: id,
      provider: 'GOOGLE',
    };

    done(null, user);
  }
}
