import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RefreshDto } from "../dto/refresh.dto.js";
import { validateBody } from "./validate-body.js";

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh'){
    async canActivate(context: ExecutionContext):  Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>()
        await validateBody(RefreshDto, req.body)
        return (await super.canActivate(context)) as boolean
    }
}