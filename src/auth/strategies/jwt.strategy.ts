import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { IUsersRepository } from "../../features/users/users.repository.interface.js";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        private readonly usersRepo: IUsersRepository,
        private readonly configService: ConfigService,
    ){
        const secret = configService.get('JWT_ACCESS_SECRET')
        if(!secret){
            throw new Error('JWT_ACCESS_SECRET is not set')
        }
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration:false,
            secretOrKey:secret
        })
    }
    async validate(payload:any){
        const user = await this.usersRepo.findById(payload.sub)
        if(!user){
            throw new UnauthorizedException ('Invalid data')
        }
        return user
    }
}