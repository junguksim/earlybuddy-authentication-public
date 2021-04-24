import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { RedisService } from 'nestjs-redis';
import { UserRepository } from 'src/users/repository/user.repository';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private authService : AuthService
  ) {
    super();
  }
  getTokenFromBearerHeader(bearerHeader: string): string {
    return bearerHeader.replace('Bearer ', '');
  }
  async getBlacklistJwt(
    redisClient: any,
    userIdx: number,
  ): Promise<string | boolean> {
    const blacklistJwt: string | null = await redisClient.get(userIdx);
    if (blacklistJwt === null) {
      return false;
    }
    return this.getTokenFromBearerHeader(blacklistJwt);
  }
  getIncomeAccessToken(authorization: string) : any {
    if (!authorization) return false;
    return this.getTokenFromBearerHeader(authorization);
  }
  
  async canActivate(context: ExecutionContext): Promise<any> {
    const redisClient = this.redisService.getClient(
      this.config.get<string>('REDIS_NAME'),
    );
    const request = context.switchToHttp().getRequest();
    const incomeAccessToken = this.getIncomeAccessToken(request.headers.authorization);
    try {
      if (!incomeAccessToken) {
        throw new BadRequestException();
      }
      this.authService.isIncomeAccessTokenAlive(incomeAccessToken);
      const userIdx: number = this.authService.getUserIdxFromIncomeAccessToken(incomeAccessToken);
      const blacklistJwt: string | boolean = await this.getBlacklistJwt(
        redisClient,
        userIdx,
      );
      if (!blacklistJwt) {
        return super.canActivate(context);
      }
      if (blacklistJwt === incomeAccessToken) {
        console.log('blacklisted token')
        throw new ForbiddenException();
      }
      return super.canActivate(context);
    } catch (e) {
      console.error(e);
    }
  }
  handleRequest(err, user){
    if (err || !user) {
      throw err || new ForbiddenException();
    }
    return user;
  }
}
