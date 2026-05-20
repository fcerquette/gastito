import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, displayName, photos } = profile;
    const composed = `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim();
    const user = {
      googleId: id,
      email: emails[0].value.toLowerCase(),
      name: composed || displayName || emails[0].value,
      avatarUrl: photos?.[0]?.value ?? null,
    };
    done(null, user);
  }
}
