import { IsString } from "class-validator";

export class refreshDto{
    @IsString()
    refresh_token:string
}