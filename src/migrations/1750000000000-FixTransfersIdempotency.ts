import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTransfersIdempotency1750000000000 implements MigrationInterface {
  name = 'FixTransfersIdempotency1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Удаляем старый уникальный констрейнт, если он есть
    // (проверьте имя, возможно, оно отличается, если генерировалось автоматически)
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP CONSTRAINT IF EXISTS "UQ_transfers_idempotency_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP CONSTRAINT IF EXISTS "transfers_idempotency_key_key"`,
    );

    // 2. Меняем тип колонки на uuid
    await queryRunner.query(
      `ALTER TABLE "transfers" ALTER COLUMN "idempotency_key" TYPE uuid USING "idempotency_key"::uuid`,
    );

    // 3. Добавляем новый составной уникальный констрейнт
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "UQ_transfers_sender_idempotency" UNIQUE ("sender_id", "idempotency_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transfers" DROP CONSTRAINT IF EXISTS "UQ_transfers_sender_idempotency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ALTER COLUMN "idempotency_key" TYPE varchar USING "idempotency_key"::varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "transfers" ADD CONSTRAINT "UQ_transfers_idempotency_key" UNIQUE ("idempotency_key")`,
    );
  }
}
