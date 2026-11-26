import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransferIdempotencyPerSender1795636633704 implements MigrationInterface {
  name = 'AddTransferIdempotencyPerSender1795636633704';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_users_login_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_age_active"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_avatars_userId_deletedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_avatars_userId_createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_balance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP CONSTRAINT "UQ_49061dae56a8d231067a8446a49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP COLUMN "idempotency_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD "idempotency_key" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "UQ_78759811ea98a642b296b6f6553" UNIQUE ("sender_id", "idempotency_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP CONSTRAINT "UQ_78759811ea98a642b296b6f6553"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP COLUMN "idempotency_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD "idempotency_key" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "UQ_49061dae56a8d231067a8446a49" UNIQUE ("idempotency_key")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_balance" CHECK ((balance >= (0)::numeric))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_avatars_userId_createdAt" ON "avatars" ("user_id", "createdAt") WHERE ("deletedAt" IS NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_avatars_userId_deletedAt" ON "avatars" ("user_id", "deletedAt") WHERE ("deletedAt" IS NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_age_active" ON "users" ("age") WHERE (("deletedAt" IS NULL) AND (description IS NOT NULL))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_login_active" ON "users" ("login") WHERE ("deletedAt" IS NULL)`,
    );
  }
}
