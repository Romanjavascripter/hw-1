import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesForActiveUsers1794152280000 implements MigrationInterface {
  name = 'AddIndexesForActiveUsers1794152280000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Индекс для быстрого поиска активных аватаров (ускоряет SubPlan)
    await queryRunner.query(`
            CREATE INDEX "IDX_avatars_userId_deletedAt" 
            ON "avatars" ("user_id", "deletedAt") 
            WHERE "deletedAt" IS NULL;
        `);

    // 2. Индекс для быстрой сортировки аватаров по дате (убирает Sort)
    await queryRunner.query(`
            CREATE INDEX "IDX_avatars_userId_createdAt" 
            ON "avatars" ("user_id", "createdAt" DESC) 
            WHERE "deletedAt" IS NULL;
        `);

    // 3. Индекс для фильтрации пользователей по возрасту
    await queryRunner.query(`
            CREATE INDEX "IDX_users_age" ON "users" ("age");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_avatars_userId_deletedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_avatars_userId_createdAt"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_users_age"`);
  }
}
