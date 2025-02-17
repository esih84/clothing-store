import { Injectable, InternalServerErrorException } from "@nestjs/common";
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
  async assignRoleToUser(shopId: number, userId: number, roleName: RoleNames) {
    const role = await this.findOneByName(roleName);
    const shopUserRole = this.shopUserRoleRepository.create({
      shopId,
      userId,
      roleId: role.id,
    });
    await this.shopUserRoleRepository.save(shopUserRole);
  }
  async findOneByName(name: RoleNames) {
    const adminShopRole = await this.roleRepository.findOneBy({
      name: name,
    });
    if (!adminShopRole) {
      throw new InternalServerErrorException("Role adminShop not found");
    }
    return adminShopRole;
  }
}
