import { Injectable } from "@nestjs/common";
import { Role } from "../entities/role.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async createRoles() {
    const roles = [
      { name: "admin" },
      { name: "adminShop" },
      { name: "storeWorker" },
      { name: "user" },
    ];

    for (const role of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: role.name },
      });
      if (!existingRole) {
        await this.roleRepository.save(role);
      }
    }
  }
}
