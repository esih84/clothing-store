import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "src/modules/auth/guards/auth.guard";
import { RoleNames } from "src/modules/role/enums/role.enum";
import { Roles } from "src/modules/shop/decorators/role-in-shop.decorator";
import { RolesGuard } from "src/modules/role/guards/role.guard";

export function Auth(...roles: RoleNames[]) {
  return applyDecorators(
    Roles(roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth("Authorization")
  );
}
