import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAvatarsTable1794152279387 implements MigrationInterface {
  name = 'CreateAvatarsTable1794152279387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "avatars" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "objectKey" character varying NOT NULL, "mimeType" character varying(50) NOT NULL, "size" integer NOT NULL, "user_id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_224de7bae2014a1557cd9930ed7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "avatars" ADD CONSTRAINT "FK_068bfde144915dbef38bae31808" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "avatars" DROP CONSTRAINT "FK_068bfde144915dbef38bae31808"`,
    );
    await queryRunner.query(`DROP TABLE "avatars"`);
  }
}
