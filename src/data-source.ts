import 'dotenv/config';
import { DataSource } from 'typeorm';
import { envSchema } from './config/env.validation.js';

const env = envSchema.parse(process.env);

export default new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});
