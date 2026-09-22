import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { CreateUserDto } from "../features/users/dto/create-user.dto.js";
import { User } from "../features/users/entity/user.entity.js";
import { LocalAuthGuard } from "./guards/local-auth.guard.js";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard.js";
import { userInfo } from "os";

@Controller('auth')
export class AuthController{
    constructor(private readonly authService:AuthService){}

    @Post('register')
    async register(@Body()dto:CreateUserDto){
            return this.authService.register(dto)
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    async login(@Request() req:{user:User}){
        return this.authService.login(req.user)
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    async refresh(@Request ()req:{user:User}){
        return this.authService.refresh(req.user)
    }
}