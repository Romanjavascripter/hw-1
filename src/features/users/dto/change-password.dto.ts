import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldPassword123',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  oldPassword: string;

  @ApiProperty({
    example: 'newSuperPassword123',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @Length(8, 72)
  newPassword: string;
}
