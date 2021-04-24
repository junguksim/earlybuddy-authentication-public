import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'userId',
    });
  }

  async validate(userId: string, inputPassword: string): Promise<any> {
    const user = await this.authService.validateUser(userId, inputPassword);
    if (user === null || !user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
