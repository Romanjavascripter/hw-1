import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TransferHeadersDto {
  @IsString()
  @IsNotEmpty({ message: 'Idempotency-Key header is required' })
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'Idempotency-Key header must be a valid UUID',
  })
  'idempotency-key': string;
}
