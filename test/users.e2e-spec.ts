// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication } from '@nestjs/common';
// import request from 'supertest';
// import { AppModule } from '../src/app.module.js';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { User } from '../src/features/users/entity/user.entity.js';
// import { Repository } from 'typeorm';

// describe('UsersController (e2e) - PATCH /users/me', () => {
//   let app: INestApplication;
//   let userRepo: Repository<User>;
//   let authToken: string;
//   let userId: string;

//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     await app.init();

//     userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));

//     // 1. Создаем тестового пользователя напрямую в БД
//     const user = await userRepo.save({
//       login: 'testuser',
//       email: 'test@example.com',
//       password: 'hashedpassword',
//       age: 25,
//     });
//     userId = user.id;

//     // 2. Получаем токен (зависит от вашей логики авторизации)
//     // Если у вас JWT, можно сгенерировать токен напрямую через JwtService
//     // или сделать POST /auth/login. Для простоты примера замокаем его:
//     // authToken = ... (ваш способ получения токена)
//   });

//   afterAll(async () => {
//     await app.close();
//   });

//   it('{} → 400 (пустое тело)', () => {
//     return request(app.getHttpServer())
//       .patch('/users/me')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send({})
//       .expect(400)
//       .expect((res) => {
//         expect(res.body.message).toBe('Payload should not be empty'); // Ваш пайп
//       });
//   });

//   it('{ login: "new" } → 200', () => {
//     return request(app.getHttpServer())
//       .patch('/users/me')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send({ login: 'new_login' })
//       .expect(200)
//       .expect((res) => {
//         expect(res.body.login).toBe('new_login');
//       });
//   });

//   it('{ login: null } → 400 (а не 500)', () => {
//     return request(app.getHttpServer())
//       .patch('/users/me')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send({ login: null })
//       .expect(400); // DTO с @ValidateIf должен отклонить это
//   });

//   it('{ email: null } → 400', () => {
//     return request(app.getHttpServer())
//       .patch('/users/me')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send({ email: null })
//       .expect(400);
//   });

//   it('{ login: "" } → 400', () => {
//     return request(app.getHttpServer())
//       .patch('/users/me')
//       .set('Authorization', `Bearer ${authToken}`)
//       .send({ login: '' })
//       .expect(400); // Если на login есть @IsNotEmpty
//   });
// });
