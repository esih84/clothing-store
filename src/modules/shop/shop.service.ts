import { ConflictException, Inject, Injectable, Scope } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { Repository } from "typeorm";
import { CreateShopDto } from "./dto/create-shop.dto";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { RoleService } from "../role/role.service";
import { RoleNames } from "../role/enums/role.enum";

@Injectable({ scope: Scope.REQUEST })
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,

    private roleService: RoleService,
    @Inject(REQUEST) private request: Request
  ) {}

  async create(createShopDto: CreateShopDto) {
    const { name } = createShopDto;
    const user = this.request["user"];
    //? Check if the shop already exists
    const existingShop = await this.findOneByName(name);
    if (existingShop) {
      throw new ConflictException("Shop already exists");
    }
    //? Create a new shop entity
    const newShop = this.shopRepository.create({ name });
    await this.shopRepository.save(newShop);

    //? Assign the adminShop role to the user
    await this.roleService.assignRoleToUser(
      newShop.id,
      user.id,
      RoleNames.ADMIN_SHOP
    );
    return {
      message: "Shop created successfully",
      shop: newShop,
    };
  }
  async findOneByName(name: string) {
    const shop = await this.shopRepository.findOneBy({ name });
    return shop;
  }
}
