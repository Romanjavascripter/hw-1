import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUsersAgePartialIndex1794775391263 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_age"`);
    await queryRunner.query(`
            CREATE INDEX "IDX_users_age_active" 
            ON "users" ("age") 
            WHERE "deletedAt" IS NULL AND "description" IS NOT NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_users_age_active"`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_users_age" ON "users" ("age")`);
  }
}
