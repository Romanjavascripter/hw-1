import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActiveUsersQueryDto {
  @ApiProperty({ example: 18 })
  @Type(() => Number) // <-- Автоматически конвертирует строку "18" в число 18
  @IsInt() // <-- Проверяет, что это целое число (не NaN, не 18.5)
  @Min(0) // <-- Минимальный возраст
  @Max(150) // <-- Максимальный возраст
  minAge: number;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  maxAge: number;
}
