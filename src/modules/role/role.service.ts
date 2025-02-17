import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { In, Repository } from "typeorm";
import { RoleNames } from "./enums/role.enum";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
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
}
