import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimestampsAndSoftDeleteIndexes1794775391262 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Меняем TIMESTAMP на TIMESTAMPTZ для users
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'UTC'`,
    );

    // Для avatars
    await queryRunner.query(
      `ALTER TABLE "avatars" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "avatars" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'UTC'`,
    );

    // Для transfers
    await queryRunner.query(
      `ALTER TABLE "transfers" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // 2. Исправляем уникальность для Soft Delete
    // Удаляем старый constraint на login
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_2d443082eccd5198f95f2a36e2c"`,
    );
    // Удаляем старый индекс на email (созданный в предыдущей миграции)
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_email_lower"`,
    );

    // Создаем новые частичные индексы (только для активных юзеров)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_users_login_active" 
            ON "users" ("login") 
            WHERE "deletedAt" IS NULL;
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_users_email_lower_active" 
            ON "users" (LOWER("email")) 
            WHERE "deletedAt" IS NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат индексов
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_email_lower_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_login_active"`,
    );

    // Возврат старых ограничений
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email_lower" ON "users" (LOWER("email"))`,
    );

    // Откат типов (полный)
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "deletedAt" TYPE timestamp`,
    );

    await queryRunner.query(
      `ALTER TABLE "avatars" ALTER COLUMN "createdAt" TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "avatars" ALTER COLUMN "deletedAt" TYPE timestamp`,
    );

    await queryRunner.query(
      `ALTER TABLE "transfers" ALTER COLUMN "createdAt" TYPE timestamp`,
    );
  }
}
