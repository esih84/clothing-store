import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Shop } from "../entities/shop.entity";
import { DataSource, Repository } from "typeorm";
import { CreateShopDto } from "../dto/create-shop.dto";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { RoleService } from "../../role/role.service";
import { RoleNames } from "../../role/enums/role.enum";
import { FileType } from "../enums/shop-file-type.enum";
import { ShopUserRole } from "../../role/entities/shop-user-role.entity";

import { ShopLocation } from "../entities/Shop-location.entity";
import { UpdateShopLocationDto } from "../dto/update-shop-location.dto";
import { UpdateShopDto } from "../dto/update-shop.dto";

@Injectable({ scope: Scope.REQUEST })
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,

    @InjectRepository(ShopLocation)
    private shopLocationRepository: Repository<ShopLocation>,
    private roleService: RoleService,
    @Inject(REQUEST) private request: Request,
    private dataSource: DataSource
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
    await this.roleService.assignRolesToUser(
      user.id,
      [RoleNames.ADMIN_SHOP],
      newShop.id
    );
    return {
      message: "Shop created successfully",
      shop: newShop,
    };
  }
  async updateShop(shopId: number, updateShopDto: UpdateShopDto) {
    const { name } = updateShopDto;
    const shop = await this.findOneById(shopId);

    if (name && name !== shop.name) {
      const shopWithSameName = await this.findOneByName(name);
      if (shopWithSameName && shopWithSameName.id !== shop.id)
        throw new ConflictException("Shop name already in use");
      shop.name = updateShopDto.name;
    }
    Object.assign(shop, updateShopDto);

    await this.shopRepository.save(shop);

    return {
      message: "Shop updated successfully",
      shop: {
        id: shop.id,
        name: shop.name,
        bio: shop.bio,
        status: shop.status,
      },
    };
  }
  async findOneByName(name: string) {
    const shop = await this.shopRepository.findOneBy({ name });
    return shop;
  }
  async findOneById(shopId: number) {
    const shop = await this.shopRepository.findOneBy({ id: shopId });
    if (!shop) {
      throw new ConflictException("Shop not found");
    }
    return shop;
  }

  async findAllUserShops() {
    const { id: userId } = this.request["user"];
    const [userShops, count] = await this.dataSource
      .getRepository(ShopUserRole)
      .createQueryBuilder("shopUserRole")
      .leftJoinAndSelect("shopUserRole.shop", "shop")
      .leftJoinAndSelect(
        "shop.files",
        "files",
        "files.fileType =:fileType AND files.isActive = :isActive",
        {
          fileType: FileType.LOGO,
          isActive: true,
        }
      )
      .select([
        "shopUserRole",
        "shop.id",
        "shop.name",
        "files.fileUrl",
        "files.fileType",
      ])
      .where("shopUserRole.userId = :userId", { userId })
      .getManyAndCount();
    return {
      message: "User stores were successfully found",
      count,
      shops: userShops.map((userShop) => userShop.shop),
    };
  }
  async updateShopLocation(
    shopId: number,
    updateShopLocationDto: UpdateShopLocationDto
  ) {
    const { city, lat, lng, addressDetails } = updateShopLocationDto;
    const shop = await this.findOneById(shopId);

    let location = await this.shopLocationRepository.findOne({
      where: { shopId: shop.id },
    });

    if (!location) {
      location = this.shopLocationRepository.create({
        shopId: shop.id,
        city,
        location: `(${lat}, ${lng})`,
        addressDetails,
      });
    } else {
      location.city = city;
      location.location = `(${lat}, ${lng})`;
      location.addressDetails = addressDetails;
    }

    await this.shopLocationRepository.save(location);

    return {
      message: "Shop location updated successfully",
      location,
    };
  }
  async getShopLocation(shopId: number) {
    const shop = await this.findOneById(shopId);

    const location = await this.shopLocationRepository.findOne({
      where: { shopId },
    });

    if (!location) {
      throw new NotFoundException("Location not found for the specified shop");
    }

    return location;
  }
}
