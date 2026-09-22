import { IsEmail, IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min} from "class-validator";

export class CreateUserDto{
    @IsString()
    @Length(3,30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Логин может содержать только латиницу, цифры и подчёркивание',
  })
    login:string;

    @IsString()
    @IsEmail()
    email:string;

    @Length(8,72)
    @IsString()
    password:string;


    @Max(100)
    @Min(12)
    @IsInt()
    age:number;

    @IsOptional()
    @MaxLength(1000)
    @IsString()
    description:string
}