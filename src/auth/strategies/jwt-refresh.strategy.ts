import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { IUsersRepository } from "../../features/users/users.repository.interface.js";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";


@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy,'jwt-refresh'){
    constructor(
        private readonly usersRepo:IUsersRepository,
        private readonly configService: ConfigService,
    ){
        const secret = configService.get('JWT_REFRESH_SECRET')
        if(!secret){
            throw new Error('REFRESH IS NOT SET')
        }
        super({
            jwtFromRequest:ExtractJwt.fromBodyField('refresh_token'),
            ignoreExpiration: false,
            secretOrKey: secret,
        })

    }
    async validate(payload:any){
        const user = await this.usersRepo.findById(payload.sub)
        if(!user){
            throw new UnauthorizedException('Invalid data')
        }
        return user
    }
    }