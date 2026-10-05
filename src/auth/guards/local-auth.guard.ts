import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { validateBody } from "./validate-body.js";
import { LoginDto } from "../dto/login.dto.js";

@Injectable()
export class LocalAuthGuard extends AuthGuard('local'){
    async canActivate(context:ExecutionContext):Promise<boolean>{
        const req = context.switchToHttp().getRequest<Request>();
        await validateBody(LoginDto,req.body)
        return (await super.canActivate(context)) as boolean
    }
}