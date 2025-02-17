import { Controller, Get, Post } from "@nestjs/common";
import { RoleService } from "./role.service";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller("role")
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  @Post("seed")
  @ApiOperation({ summary: "Seed default roles into the database" })
  @ApiResponse({
    status: 201,
    description: "Roles seeded successfully",
  })
  seedRoles() {
    return this.roleService.seedRoles();
  }
}
