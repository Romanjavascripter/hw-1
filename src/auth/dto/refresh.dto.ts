import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh-токен, полученный при логине или регистрации',
  })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
