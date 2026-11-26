import { z } from 'zod';

export const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000), // coerce превращает строку в число

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number(), // <-- магия здесь
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES_IN: z.string(),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_REFRESH_EXPIRES_IN: z.string(),

  // S3 / MinIO
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string(),

  // Redis & Cache
  REDIS_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  CACHE_TTL_MS: z.coerce.number(),

  // Cleanup
  AVATAR_CLEANUP_CRON: z.string(),
  AVATAR_CLEANUP_RETENTION_DAYS: z.coerce.number(),
  AVATAR_MAX_BYTES: z.coerce.number().default(10485760),
});

export type EnvConfig = z.infer<typeof envSchema>;
