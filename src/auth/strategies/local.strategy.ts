import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { IUsersRepository } from "../../features/users/users.repository.interface.js";
import * as bcrypt from 'bcrypt';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
    constructor(private readonly usersRepo:IUsersRepository){
        super({
            usernameField:'login',
            passwordField:'password'
        })
    }

    async validate(login:string,password:string){
        const user = await this.usersRepo.findByLoginWithPassword(login)
        if(!user){
            throw new UnauthorizedException('Invalid data')
        }
        const isValid = await bcrypt.compare(password, user.password)
        if(!isValid){
            throw new UnauthorizedException('Invalid data')
        }
        return user
    }
}