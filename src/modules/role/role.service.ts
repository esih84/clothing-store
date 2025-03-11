import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { In, Repository } from "typeorm";
import { RoleNames } from "./enums/role.enum";
import { ShopUserRole } from "./entities/shop-user-role.entity";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(ShopUserRole)
    private shopUserRoleRepository: Repository<ShopUserRole>
  ) {}
  async seedRoles() {
    try {
      const existingRoles = await this.roleRepository.find({
        where: { name: In(Object.values(RoleNames)) },
      });
      const existingRoleNames = existingRoles.map((role) => role.name);
      const rolesToCreate = Object.values(RoleNames)
        .filter((roleName) => !existingRoleNames.includes(roleName))
        .map((roleName) => this.roleRepository.create({ name: roleName }));

      if (rolesToCreate.length > 0) {
        await this.roleRepository.save(rolesToCreate);
        return { message: "Roles seeded successfully" };
      }
      return { message: "No new roles to seed" };
    } catch (error) {
      throw new Error("Error seeding roles: " + error.message);
    }
  }
  async assignRolesToUser(
    userId: number,
    roleNames: RoleNames[],
    shopId?: number
  ) {
    const roles = await this.findRolesByName(roleNames);
    if (shopId) {
      const existingRoles = await this.shopUserRoleRepository.find({
        where: { userId, shopId },
      });
      if (existingRoles.length > 0) {
        await this.shopUserRoleRepository.remove(existingRoles);
      }
    }
    const shopUserRole = roles.map((role) => ({
      shopId: shopId ?? null,
      userId,

      roleId: role.id,
    }));
    await this.shopUserRoleRepository.save(shopUserRole);
  }

  async findRolesByName(names: RoleNames[]) {
    const roles = await this.roleRepository.find({
      where: { name: In(names) },
    });
    if (!roles || roles.length === 0) {
      throw new NotFoundException("Roles not found");
    }
    return roles;
  }
  async CheckUserRole(userId: number, roleName: RoleNames, shopId?: number) {
    const role = await this.findRolesByName([roleName]);
    const shopUserRole = await this.shopUserRoleRepository.findOne({
      where: {
        userId,
        shopId: shopId ?? null,
        roleId: role[0].id,
      },
    });

    return !!shopUserRole;
  }
}
