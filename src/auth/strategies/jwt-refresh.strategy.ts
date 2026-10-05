import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { IUsersRepository } from "../../features/users/users.repository.interface.js";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../jwt-payload.interface.js";
import { User } from "../../features/users/entity/user.entity.js";
import { hashToken } from "../hash-token.js";
import { Request } from "express";


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
            passReqToCallback:true
        })

    }
    async validate(req:Request, payload:JwtPayload):Promise<User>{
        const token :unknown = req.body?.refresh_token
        const user = await this.usersRepo.findByIdWithRefreshToken(payload.sub)
        if(typeof token !== 'string' ||
            !user?.refreshTokenHash ||
            user.refreshTokenHash!==hashToken(token)
            ){
            throw new UnauthorizedException('Invalid data')
        }
        return user
    }
    }