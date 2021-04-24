import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/User.entity';
import { UserRepository } from './repository/user.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let app : INestApplication;
  let usersService: UsersService;
  let userRepository : UserRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports : [
        TypeOrmModule.forRoot({
          "type": "mysql",
          "host": "simrds.cegur6xy4tef.ap-northeast-2.rds.amazonaws.com",
          "port": 3306,
          "username": "simju1001",
          "password": "rzpq2963!!",
          "database": "earlybuddy_3rd_authentication_test",
          "entities": ["./**/*.entity{.ts,.js}"],
        }),
        TypeOrmModule.forFeature([UserRepository]),
      ],
      providers : [UsersService],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    usersService = module.get<UsersService>(UsersService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  describe("getAllUser", () => {
    it("should return all User array", async () => {
      const result = await usersService.getAllUserInfo();
      console.log(result)
      expect(result).toBeInstanceOf(Array);
    })
  })

  describe("signup", () => {
    it("should create a user", async () => {
      const result = await usersService.signup({
        userId : "IamTest",
        password : "asdf1234"
      })
      expect(result).toHaveProperty("userIdx");
      expect(result).toHaveProperty("userId");
    })
  })

  describe("getUserInfo", () => {
    it("should return a User", async () => {
      const allUser : User[] = await usersService.getAllUserInfo();
      const {userIdx : getUserIdx} = allUser[allUser.length - 1];
      const result = await usersService.getUserInfo(getUserIdx);
      Object.keys(User).map((userKey) => {
        expect(result).toHaveProperty(userKey);
      })
    })
  })

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      const allUser : User[] = await usersService.getAllUserInfo();
      const {userIdx : deleteUserIdx} = allUser[allUser.length - 1];
      const result = await usersService.deleteUser(deleteUserIdx);
      console.log(result);
      expect(result).toHaveProperty("userIdx");
    })
  })
});
