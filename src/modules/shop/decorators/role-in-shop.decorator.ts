import { SetMetadata } from "@nestjs/common";
import { RoleNames } from "src/modules/role/enums/role.enum";

export const ROLES_KEY = "roles";
export const Roles = (roles: RoleNames[]) => SetMetadata(ROLES_KEY, roles);
