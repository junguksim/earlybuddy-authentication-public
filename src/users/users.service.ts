import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './repository/user.repository';
import { User } from './entities/User.entity';
import { ConfigService } from '@nestjs/config';
import { FavoriteRepository } from './repository/favorite.repository';
import { Favorite } from './entities/Favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Connection } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: UserRepository,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private favoriteRepository: FavoriteRepository,
    private readonly config: ConfigService,
    private connection: Connection,
    private jwtService: JwtService,
  ) {}
  private saltRounds = 10;

  getAllUserInfo(): Promise<User[]> {
    return this.userRepository.find();
  }
  getUserInfo(userIdx: number): Promise<User> {
    return this.userRepository.findOne(userIdx);
  }
  findUserById(userId: string): Promise<User> {
    return this.userRepository.findOne({ userId });
  }
  async signup(userData: CreateUserDto): Promise<{ userIdx; userId }> {
    const { userId, password } = userData;
    const salt: string = await bcrypt.genSalt(this.saltRounds);
    const hashed: string = await bcrypt.hash(password, salt);
    const saveUserData = { userId, password: hashed, salt };
    const { userIdx } = await this.userRepository.save(saveUserData);

    return {
      userIdx,
      userId,
    };
  }

  async setUserName(
    userIdx: number,
    userNameData: UpdateUserDto,
  ): Promise<{ userIdx; username }> {
    const { username } = userNameData;
    if (
      (await this.userRepository.update({ userIdx }, { username })).affected ==
      0
    ) {
      throw new NotFoundException();
    }
    return { userIdx, username };
  }

  async deleteUser(userIdx: number): Promise<{ userIdx }> {
    await this.userRepository.delete(userIdx);
    return { userIdx };
  }

  async checkId(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ userId });
    if (user) {
      throw new ConflictException();
    }
    return null;
  }

  async setFavorite(
    favoriteArr: CreateFavoriteDto[],
    userIdx: number,
  ): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await this.userRepository.findOne(userIdx);
      await this.favoriteRepository.delete({
        fk_userIdx: userIdx,
      });
      await this.userRepository.save({
        favorites: favoriteArr,
        ...user,
      });
      await queryRunner.commitTransaction();
    } catch (err) {
      console.error(`${this.setFavorite.name} Rollback 발생`);
      console.error(err);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async getFavorite(userIdx: number): Promise<Favorite[]> {
    return await this.favoriteRepository.find({
      fk_userIdx: userIdx,
    });
  }

  refreshAccessToken(refreshToken: string, expiredAccessToken: string): any {
    try {
      this.authService.isIncomeRefreshTokenAlive(refreshToken);
      expiredAccessToken = expiredAccessToken.replace('Bearer ', '');
      const {
        username,
        userIdx,
        sub,
      }: any = this.authService.decodeAccessToken(expiredAccessToken);
      const accessPayload = {
        username,
        userIdx,
        sub,
      };
      const accessToken = this.authService.issueAccessToken(accessPayload);
      return {
        userIdx,
        username,
        userId: sub,
        accessToken,
      };
    } catch (e) {
      console.error(e);
      throw new ForbiddenException();
    }
  }
}
