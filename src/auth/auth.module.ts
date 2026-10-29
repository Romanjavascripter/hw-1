import { Module } from "@nestjs/common";
import { UsersModule } from "../features/users/users.module.js";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PassportModule} from "@nestjs/passport";
import { LocalStrategy } from "./strategies/local.strategy.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy.js";

@Module({
    imports:[UsersModule, JwtModule.register({}), PassportModule.register({})],
    controllers:[AuthController],
    providers:[AuthService, LocalStrategy,JwtStrategy, JwtRefreshStrategy]
})
export class AuthModule{}