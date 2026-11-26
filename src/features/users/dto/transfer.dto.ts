import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'uuid получателя' })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;
  @ApiProperty({
    example: '42.24',
    pattern: '^(?!0+(\\.0{1,2})?$)\\d+(?:\\.\\d{1,2})?$',
  })
  @IsString()
  @Matches(/^(?!0+(\.0{1,2})?$)\d{1,10}(\.\d{1,2})?$/, {
    message:
      'Amount must be a positive number with max 10 digits before dot and max 2 decimal places',
  })
  amount: string;
}
