import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransfersTable1794775391261 implements MigrationInterface {
  name = 'CreateTransfersTable1794775391261';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transfers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sender_id" uuid NOT NULL, "receiver_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "sender_balance_after" numeric(12,2) NOT NULL, "idempotency_key" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_49061dae56a8d231067a8446a49" UNIQUE ("idempotency_key"), CONSTRAINT "PK_f712e908b465e0085b4408cabc3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_f7f67b6fc0dbefadee6433e7876" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "FK_8264e5f18e5cf3a017186e94a4c" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP CONSTRAINT "FK_8264e5f18e5cf3a017186e94a4c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP CONSTRAINT "FK_f7f67b6fc0dbefadee6433e7876"`,
    );
    await queryRunner.query(`DROP TABLE "transfers"`);
  }
}
