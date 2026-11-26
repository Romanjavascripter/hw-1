import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckBalanceConstraint1794775391264 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "CHK_users_balance" 
            CHECK ("balance" >= 0);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP CONSTRAINT "CHK_users_balance";
        `);
  }
}
