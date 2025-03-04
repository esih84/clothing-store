import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { DataSource, DeepPartial, Repository } from "typeorm";
import { CreateShopDto } from "./dto/create-shop.dto";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { RoleService } from "../role/role.service";
import { RoleNames } from "../role/enums/role.enum";
import { ShopFile } from "./entities/shop-file.entity";
import { FileUploadDto } from "./dto/file-upload.dto";
import { FileType } from "./enums/shop-file-type.enum";
import { S3Service } from "../s3/s3.service";
import { ShopUserRole } from "../role/entities/shop-user-role.entity";

@Injectable({ scope: Scope.REQUEST })
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(ShopFile)
    private shopFileRepository: Repository<ShopFile>,
    @InjectRepository(ShopUserRole)
    private shopUserRoleRepository: Repository<ShopUserRole>,
    private s3Service: S3Service,
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

  async UploadFile(
    shopId: number,
    fileUploadDto: FileUploadDto,
    files: Express.Multer.File[]
  ) {
    const { fileType } = fileUploadDto;
    const shop = await this.findOneById(shopId);
    // Check the number of existing files of the same type
    const existingFilesCount = await this.shopFileRepository.count({
      where: { shopId: shop.id, fileType },
    });
    const maxFilesAllowed = this.getMaxFilesAllowed(fileType);

    if (existingFilesCount + files.length > maxFilesAllowed) {
      throw new BadRequestException(
        `Cannot upload more than ${maxFilesAllowed} ${fileType.toLowerCase()} files`
      );
    }
    this.validateFiles(fileType, files);

    const foldername = fileType === FileType.DOC ? "shop_docs" : "shop_files";

    const fileResultLocations = await Promise.all(
      files.map(async (file): Promise<DeepPartial<ShopFile>> => {
        const data = await this.s3Service.uploadFile(file, foldername);

        return {
          shopId,
          fileType,
          fileUrl: data.Location,
        };
      })
    );
    await this.shopFileRepository.insert(fileResultLocations);
    return {
      message: "Files uploaded successfully",
    };
  }
  private getMaxFilesAllowed(fileType: FileType): number {
    switch (fileType) {
      case FileType.BANNER:
        return 6;
      case FileType.DOC:
      case FileType.LOGO:
        return 3;
      case FileType.VIDEO:
        return 2;
      default:
        throw new BadRequestException("Invalid file type");
    }
  }
  private validateFiles(fileType: FileType, files: Express.Multer.File[]) {
    const { validMimeTypes, maxSize } = this.getValidMimeTypes(fileType);

    for (const file of files) {
      if (!validMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
      }
      if (file.size > maxSize) {
        throw new BadRequestException(
          `File size exceeds the limit of ${maxSize / (1000 * 1000)} MB`
        );
      }
    }
  }

  private getValidMimeTypes(fileType: FileType) {
    switch (fileType) {
      case FileType.BANNER:
      case FileType.DOC:
      case FileType.LOGO:
        return {
          validMimeTypes: ["image/jpeg", "image/png", "image/jpg"],
          maxSize: 24 * 1000 * 1000,
        };
      case FileType.VIDEO:
        return {
          validMimeTypes: ["video/mp4"],
          maxSize: 300 * 1000 * 1000,
        };
      default:
        throw new BadRequestException("Invalid file type");
    }
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
}
