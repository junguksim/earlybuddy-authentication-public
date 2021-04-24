import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RedisService } from 'nestjs-redis';
import { responseMessage } from 'src/response-message';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/User.entity';
import { authorizationSettings } from './swagger-settings/authorization-settings';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
export class UsersController {
  constructor(
    readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  @Post('/signup')
  @ApiCreatedResponse({ description: responseMessage.signup })
  signup(@Body() userData: CreateUserDto) {
    return this.usersService.signup(userData);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  @ApiOkResponse({ description: responseMessage.signin })
  @ApiBody({ type: CreateUserDto })
  async signin(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiHeader(authorizationSettings.accesstoken)
  @ApiOkResponse({ description: responseMessage.getUserInfo })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  getUserInfo(@Request() req): Promise<User> {
    return this.usersService.getUserInfo(req.user.userIdx);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/setUserName')
  @ApiHeader(authorizationSettings.accesstoken)
  @ApiBody({ type: UpdateUserDto })
  setUserName(@Request() req, @Body() userNameData: UpdateUserDto) {
    const { userIdx } = req.user;
    return this.usersService.setUserName(userIdx, userNameData);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/setFavorite')
  @ApiHeader(authorizationSettings.accesstoken)
  @ApiBody({ type: [CreateFavoriteDto] })
  async setFavorite(@Request() req, @Body() favoriteArr: CreateFavoriteDto[]) {
    return this.usersService.setFavorite(favoriteArr, req.user.userIdx);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/getFavorite')
  @ApiHeader(authorizationSettings.accesstoken)
  async getFavorite(@Request() req) {
    return this.usersService.getFavorite(req.user.userIdx);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logout')
  @ApiHeader(authorizationSettings.accesstoken)
  async logout(@Request() req): Promise<void> {
    const client = await this.redisService.getClient(
      this.config.get('REDIS_NAME'),
    );
    await client.set(req.user.userIdx, req.headers.authorization);
    await req.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiHeader(authorizationSettings.accesstoken)
  async deleteUser(@Request() req) {
    const { userIdx } = req.user;
    await this.logout(req);
    return this.usersService.deleteUser(userIdx);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  @ApiHeader(authorizationSettings.accesstoken)
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('/refresh')
  @ApiHeader(authorizationSettings.accesstoken)
  @ApiHeader(authorizationSettings.refreshtoken)
  refreshAccessToken(@Request() req) {
    return this.usersService.refreshAccessToken(
      req.headers.refreshtoken,
      req.headers.authorization,
    );
  }

  @Get('/checkId')
  async checkId(@Query('userId') userId: string) {
    return this.usersService.checkId(userId);
  }
}
