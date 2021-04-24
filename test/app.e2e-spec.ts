import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../src/users/entities/User.entity';
import { responseMessage } from '../src/response-message';
import { Favorite } from '../src/users/entities/Favorite.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (config: ConfigService) => ({
            type: 'mysql',
            host: config.get('DB_HOST'),
            port: +config.get('DB_PORT'),
            username: config.get('DB_USERNAME'),
            password: config.get('DB_PASSWORD'),
            database: config.get('DB_DATABASE'),
            entities: [User, Favorite],
          }),
          inject: [ConfigService],
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users', () => {
    let testJwt: string;
    let testRefreshToken: string;
    let testUserIdx: number;
    it('POST /signup should return 201 (회원가입 성공)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .post('/users/signup')
        .send({
          userId: 'HiTest',
          password: 'password',
        });
      expect(res.status).toEqual(201);
      expect(res.body.resMsg).toEqual(responseMessage.signup);
      expect(typeof res.body.data.userIdx).toBe('number');
      expect(typeof res.body.data.userId).toBe('string');
      testUserIdx = res.body.data.userIdx;
    });

    it('POST /signin should return 201 (로그인 성공)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .post('/users/signin')
        .send({
          userId: 'HiTest',
          password: 'password',
        });
      expect(res.status).toEqual(201);
      expect(res.type).toEqual('application/json');
      expect(res.body.resMsg).toEqual(responseMessage.signin);
      expect(res.body.data.userIdx).toEqual(testUserIdx);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
      testJwt = res.body.data.accessToken;
      testRefreshToken = res.body.data.refreshToken;
    });

    it('POST /signin should return 404 (로그인 시 ID가 존재하지 않는 경우)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .post('/users/signin')
        .send({
          userId: 'NotFoundID',
          password: 'password',
        });
      expect(res.status).toEqual(404);
      expect(res.type).toEqual('application/json');
    });

    it('POST /signin should return 401 (로그인 시 비밀번호가 올바르지 않은 경우)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .post('/users/signin')
        .send({
          userId: 'HiTest',
          password: 'IncorrectPassword',
        });
      expect(res.status).toEqual(401);
      expect(res.type).toEqual('application/json');
    });

    it('GET / should return 200(유저 조회 성공)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .get(`/users`)
        .set('Authorization', `Bearer ${testJwt}`);
      expect(res.status).toEqual(200);
      expect(res.body.data.userIdx).toEqual(testUserIdx);
      expect(res.body.data.username).toEqual('이비');
      expect(res.body.data.userId).toEqual('HiTest');
      expect(res.body.resMsg).toEqual(responseMessage.getUserInfo);
    });

    it('GET /signin should return 403 (유저 조회 시 토큰이 입력되지 않거나 올바르지 않을 경우)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${testJwt}incorrect`);
      expect(res.status).toEqual(403);
      expect(res.type).toEqual('application/json');
    });

    it('PUT /setUserName should return 200 (닉네임 변경 성공)', async () => {
      const userInfoBeforeChangeRes: request.Response = await request(
        app.getHttpServer(),
      )
        .get(`/users`)
        .set('Authorization', `Bearer ${testJwt}`);
      const res: request.Response = await request(app.getHttpServer())
        .put('/users/setUserName')
        .send({
          username: 'NewName',
        })
        .set('Authorization', `Bearer ${testJwt}`);
      const userInfoAfterChangeRes: request.Response = await request(
        app.getHttpServer(),
      )
        .get(`/users`)
        .set('Authorization', `Bearer ${testJwt}`);
      expect(res.status).toEqual(200);
      expect(res.body.data.username).toEqual('NewName');
      expect(userInfoBeforeChangeRes.body.data.username).toEqual('이비');
      expect(userInfoAfterChangeRes.body.data.username).toEqual('NewName');
      expect(res.body.resMsg).toEqual(responseMessage.setUserName);
    });

    it('GET /checkId should return 409 (아이디 중복 확인 : 중복의 경우)', async () => {
      return request(app.getHttpServer())
        .get('/users/checkId?userId=HiTest')
        .expect(409);
    });

    it('GET /checkId should return 200 (아이디 중복 확인 : 중복이 아닌 경우)', async () => {
      const res: request.Response = await request(app.getHttpServer()).get(
        '/users/checkId?userId=IamAble',
      );
      expect(res.status).toEqual(200);
      expect(res.body.resMsg).toEqual(responseMessage.checkId);
    });

    it('PUT /setFavorite return 200 (즐겨 찾는 장소 설정 성공)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .put('/users/setFavorite')
        .set('Authorization', `Bearer ${testJwt}`)
        .send([
          {
            favoriteInfo: 'Home',
            favoriteCategory: 0,
            favoriteLongitude: '127.07700220573338',
            favoriteLatitude: '37.624869907611554',
          },
          {
            favoriteInfo: 'Company',
            favoriteCategory: 1,
            favoriteLongitude: '126.983151948921',
            favoriteLatitude: '37.57022889206912',
          },
          {
            favoriteInfo: 'School',
            favoriteCategory: 2,
            favoriteLongitude: '127.077526020922',
            favoriteLatitude: '37.6318648220506',
          },
        ]);
      expect(res.status).toEqual(200);
      expect(res.body.resMsg).toEqual(responseMessage.setFavorite);
    });

    it('GET /getFavorite should return 200 (즐겨 찾는 장소 조회 성공) ', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .get('/users/getFavorite')
        .set('Authorization', `Bearer ${testJwt}`);
      expect(res.status).toEqual(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('GET /profile (jwt 테스트)', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${testJwt}`)
        .send({
          refreshToken: testRefreshToken,
        });
    });
    it('DELETE / should return 200 (유저 탈퇴 성공)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .delete('/users')
        .set('Authorization', `Bearer ${testJwt}`);
      expect(res.status).toEqual(200);
      expect(res.body.data.userIdx).toEqual(testUserIdx);
      expect(res.body.resMsg).toEqual(responseMessage.deleteUser);
    });

    it('DELETE / should return 403 (유저 탈퇴 시 토큰이 입력되지 않거나 올바르지 않을 경우)', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .delete('/users')
        .set('Authorization', `Bearer ${testJwt}incorrect`);
      expect(res.status).toEqual(403);
      expect(res.type).toEqual('application/json');
    });
  });
});
