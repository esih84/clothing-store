import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { isJWT } from "class-validator";
import { Request } from "express";
import { AuthService } from "../auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    request["user"] = await this.authService.validateAccessToken(token);
    return true;
  }
  private extractTokenFromHeader(request: Request) {
    const { authorization } = request.headers;
    if (!authorization || authorization?.trim() === "") {
      throw new UnauthorizedException("No token has been sent");
    }
    const [type, token] = authorization.split(" ");
    if (type.toLowerCase() !== "bearer" || !token || !isJWT(token)) {
      throw new UnauthorizedException("The token sent is invalid");
    }
    return token;
  }
}
