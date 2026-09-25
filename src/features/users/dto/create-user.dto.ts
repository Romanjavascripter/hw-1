import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min} from "class-validator";

export class CreateUserDto{
   @ApiProperty({
    example: 'alex',
    minLength: 3,
    maxLength: 50,
    description: 'Латиница, цифры и подчёркивание',
  })
    @IsString()
    @Length(3,50)
    @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Логин может содержать только латиницу, цифры и подчёркивание',
  })
    login:string;

    @ApiProperty({ example: 'alex@mail.com', maxLength: 50 })
    @IsString()
    @MaxLength(50)
    @IsEmail()
    email:string;

    @ApiProperty({
    example: 'password123',
    minLength: 8,
    maxLength: 72,
    description: 'Ограничение сверху — предел bcrypt',
  })
    @Length(8,72)
    @IsString()
    password:string;

    @ApiProperty({ example: 25, minimum: 12, maximum: 100 })
    @Max(100)
    @Min(12)
    @IsInt()
    age:number;

    @ApiPropertyOptional({
    example: 'OneLoveNest',
    maxLength: 1000,
  })
    @IsOptional()
    @MaxLength(1000)
    @IsString()
    description?:string
}