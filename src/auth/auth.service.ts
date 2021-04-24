import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../users/repository/user.repository';
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly config: ConfigService,
    private userRepository: UserRepository,
  ) {}

  async validateUser(userId: string, inputPassword: string): Promise<any> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    const hashed = await bcrypt.hash(inputPassword, user.salt);
    if (user && user.password === hashed) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  issueAccessToken(accessPayload) {
    return this.jwtService.sign(accessPayload, {
      secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });
  }
  issueRefreshToken() {
    return this.jwtService.sign({}, {
      secret: this.config.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });
  }
  isIncomeAccessTokenAlive(incomeAccessToken: string) : any {
    try {
      this.jwtService.verify(incomeAccessToken, {
        secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
      });
    } catch (e) {
      return false;
    }
  }
  isIncomeRefreshTokenAlive(incomeRefreshToken : string) : any {
    try {
      this.jwtService.verify(incomeRefreshToken, {
        secret: this.config.get('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch (e) {
      return false;
    }
  }

  decodeAccessToken(accessToken : string) : any {
    return this.jwtService.decode(accessToken, {
      json : true
    })
  }

  getUserIdxFromIncomeAccessToken(incomeAccessToken: string): number {
    const { userIdx }: any = this.jwtService.decode(incomeAccessToken, {
      json: true,
    });
    return userIdx;
  }

  async login(user: any) {
    const { userIdx, username, userId } = user;
    const accessPayload = {
      username,
      userIdx,
      sub: userId,
    };
    const refreshToken: string = this.issueRefreshToken();
    await this.userRepository.update(
      {
        userIdx,
      },
      {
        currentHashedRefreshToken: refreshToken,
      },
    );
    return {
      userIdx,
      accessToken: this.issueAccessToken(accessPayload),
      refreshToken,
    };
  }
}
