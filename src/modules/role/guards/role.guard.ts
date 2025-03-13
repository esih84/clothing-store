import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { ShopService } from "../../shop/services/shop.service";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../../shop/decorators/role-in-shop.decorator";
import { RoleNames } from "src/modules/role/enums/role.enum";
import { RoleService } from "src/modules/role/role.service";
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private shopService: ShopService,
    private roleService: RoleService,
    private readonly reflector: Reflector
  ) {}
  async canActivate(context: ExecutionContext) {
    const requiredRole = this.reflector.getAllAndOverride<RoleNames[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredRole || requiredRole.length <= 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const user = request["user"];
    if (!user) {
      throw new UnauthorizedException("user information is missing");
    }
    const roles = await this.roleService.findRolesByName(requiredRole);
    const shopId = request.params.shopId || request.body.shopId;
    const permissions = await Promise.all(
      roles.map(async (role) => {
        if (role.isForShop) {
          if (!shopId) return false;
          const shop = await this.shopService.findOneById(+shopId);
          const userRoles = await this.roleService.CheckUserRole(
            user.id,
            role.name,
            shop.id
          );
          return userRoles;
        } else {
          const userRoles = await this.roleService.CheckUserRole(
            user.id,
            role.name
          );
          return userRoles;
        }
      })
    );
    const hasAccess = permissions.some((permission) => permission === true);
    if (!hasAccess) {
      throw new ForbiddenException();
    }
    return true;
  }
}
