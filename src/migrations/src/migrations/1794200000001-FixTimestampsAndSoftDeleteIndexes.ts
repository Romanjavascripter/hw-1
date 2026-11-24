import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimestampsAndSoftDeleteIndexes1794200000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'UTC'`,
    );

    await queryRunner.query(
      `ALTER TABLE "avatars" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "avatars" ALTER COLUMN "deletedAt" TYPE timestamptz USING "deletedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_email_lower"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_2d443082eccd5198f95f2a36e2c"`,
    );

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
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_email_lower_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_login_active"`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email_lower" ON "users" (LOWER("email"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE timestamp USING "createdAt" AT TIME ZONE 'UTC'`,
    );
  }
}
