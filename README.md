# HW-Authorization

Учебный проект: авторизация на NestJS + PostgreSQL + TypeORM.

## Запуск

```bash
npm install
cp .env.example .env    # подставить свои секреты
docker compose up -d    # база
npm run start:dev       # приложение
```

Swagger: http://localhost:3000/api

В docker-compose только PostgreSQL, приложение запускается в терминале.

## Эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/auth/register` | Регистрация, возвращает пару токенов |
| POST | `/auth/login` | Вход по логину и паролю |
| POST | `/auth/refresh` | Новая пара токенов по refresh |
| GET | `/profile/my` | Свой профиль |
| PATCH | `/profile/my` | Изменить свои данные |
| DELETE | `/profile/my` | Мягкое удаление аккаунта |
| GET | `/users` | Список: `page`, `limit`, `search` |

Всё кроме `/auth/*` требует заголовок `Authorization: Bearer <access_token>`.

## Переменные окружения

Смотри `.env.example`. Секреты для токенов удобно сгенерировать так:

```bash
openssl rand -base64 32
```

## Тесты

```bash
npm test
```

## Заметки по реализации

- Access и refresh подписываются разными секретами
- Пароль хранится как bcrypt-хеш, колонка помечена `select: false`
- Удаление мягкое: `deletedAt` вместо `DELETE`
- Свой профиль берётся из токена, поэтому в пути нет `:id`