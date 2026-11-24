import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBalanceToUsers1794492871675 implements MigrationInterface {
  name = 'AddBalanceToUsers1794492871675';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "balance" numeric(12,2) NOT NULL DEFAULT '0'`,
    );

    await queryRunner.query(`
        ALTER TABLE "users" 
        ADD CONSTRAINT "CHK_users_balance" 
        CHECK ("balance" >= 0);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_balance"`,
    );

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "balance"`);
  }
}
