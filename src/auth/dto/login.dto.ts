import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto{
    @ApiProperty({example:"alex"})
    @IsString()
    @IsNotEmpty()
    login:string;

    @ApiProperty({example:"qwerty123!"})
    @IsString()
    @IsNotEmpty()
    password:string
}