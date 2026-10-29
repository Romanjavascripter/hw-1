import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { User } from "../entity/user.entity.js";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class FindUsersDto{

@ApiPropertyOptional({
    example: 'user',
    maxLength: 50,
    description: 'Поиск по логину, регистр не важен',
  })
@IsOptional()
@IsString()
@MaxLength(50)
search?:string;

@ApiProperty({ example: 10, minimum: 1, maximum: 100, default: 10 })
@Type(() => Number)
@IsInt()
@Min(1)
@Max(100)
limit:number=10;

@ApiProperty({ example: 1, minimum: 1, default: 1 })
@Type(() => Number)
@IsInt()
@Min(1)
page:number=1

}

export class PaginatedDto{
    items:Omit<User, 'password'>[];
    page:number;
    total:number;
    limit:number;
    totalPages:number
}