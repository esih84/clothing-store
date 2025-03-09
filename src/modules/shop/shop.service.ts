import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { DataSource, DeepPartial, In, Repository } from "typeorm";
import { CreateShopDto } from "./dto/create-shop.dto";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { RoleService } from "../role/role.service";
import { RoleNames } from "../role/enums/role.enum";
import { ShopFile } from "./entities/shop-file.entity";
import { FileType } from "./enums/shop-file-type.enum";
import { S3Service } from "../s3/s3.service";
import { ShopUserRole } from "../role/entities/shop-user-role.entity";
import { VerificationStatus } from "./enums/shop.enum";

import { ShopLocation } from "./entities/Shop-location.entity";
import { UpdateShopLocationDto } from "./dto/update-shop-location.dto";
import { UpdateShopDto } from "./dto/update-shop.dto";
import { GetShopFilesDto, ToggleFilesDto } from "./dto/file.dto";
import { GetShopDocsDto } from "./dto/document.dto";

@Injectable({ scope: Scope.REQUEST })
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(ShopFile)
    private shopFileRepository: Repository<ShopFile>,
    @InjectRepository(ShopLocation)
    private shopLocationRepository: Repository<ShopLocation>,
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

  async UploadFile(
    shopId: number,
    fileType: FileType,
    files: Express.Multer.File[]
  ) {
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

    const foldername =
      fileType === (FileType.DOC || FileType.CONTRACT)
        ? "shop_docs"
        : "shop_files";

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
    if (fileType === FileType.DOC) {
      if (shop.verificationStatus !== VerificationStatus.UNVERIFIED) {
        throw new BadRequestException("Unable upload document files now");
      }

      shop.verificationStatus = VerificationStatus.SHOP_DOCUMENT_UPLOADED;
      await this.shopRepository.save(shop);
    } else if (fileType === FileType.CONTRACT) {
      if (
        shop.verificationStatus !== VerificationStatus.SHOP_DOCUMENT_UPLOADED
      ) {
        throw new BadRequestException("Unable upload contract files now");
      }

      shop.verificationStatus = VerificationStatus.CONTRACT;
      await this.shopRepository.save(shop);
    }
    return {
      message: "Files uploaded successfully",
    };
  }

  async toggleFilesActivationGeneric(
    shopId: number,
    toggleFilesDto: ToggleFilesDto,
    allowedFileTypes?: FileType[]
  ) {
    const { fileIds } = toggleFilesDto;
    const files = await this.shopFileRepository.find({
      where: { id: In(fileIds), shopId },
    });

    if (files.length !== fileIds.length) {
      throw new NotFoundException("One or more files not found");
    }

    const fileGroups = new Map<FileType, ShopFile[]>();
    files.forEach((file) => {
      if (!fileGroups.has(file.fileType)) {
        fileGroups.set(file.fileType, []);
      }
      fileGroups.get(file.fileType).push(file);
    });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const [fileType, selectedFiles] of fileGroups.entries()) {
        if (allowedFileTypes && !allowedFileTypes.includes(fileType)) {
          throw new UnauthorizedException(
            "You do not have permission to change the activation status of these files"
          );
        }

        const maxAllowed = this.getMaxActiveFiles(fileType);

        const filesToDeactivate = selectedFiles.filter((file) => file.isActive);
        const filesToActivate = selectedFiles.filter((file) => !file.isActive);

        if (filesToDeactivate.length > 0) {
          await queryRunner.manager.update(
            ShopFile,
            { id: In(filesToDeactivate.map((file) => file.id)) },
            { isActive: false }
          );
        }

        if (filesToActivate.length > 0) {
          const activeFiles = await queryRunner.manager.find(ShopFile, {
            where: { shopId, fileType, isActive: true },
          });

          if (activeFiles.length + filesToActivate.length > maxAllowed) {
            if (maxAllowed === filesToActivate.length) {
              await queryRunner.manager.update(
                ShopFile,
                { id: In(activeFiles.map((file) => file.id)) },
                { isActive: false }
              );
            } else {
              throw new BadRequestException(
                `Cannot activate more than ${maxAllowed} ${fileType.toLowerCase()} files`
              );
            }
          }

          await queryRunner.manager.update(
            ShopFile,
            { id: In(filesToActivate.map((file) => file.id)) },
            { isActive: true }
          );
        }
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error.response &&
        error.response.message &&
        error.response.statusCode
      ) {
        throw new HttpException(
          error.response.message,
          error.response.statusCode
        );
      } else {
        throw new BadRequestException(
          error.message || "An unexpected error occurred."
        );
      }
    }

    return { message: "Files activation status updated successfully" };
  }

  async SoftDeleteFiles(
    shopId: number,
    deleteFilesDto: ToggleFilesDto,
    allowedFileTypes?: FileType[]
  ) {
    const { fileIds } = deleteFilesDto;

    const files = await this.shopFileRepository.find({
      where: { id: In(fileIds), shopId },
    });

    if (files.length !== fileIds.length) {
      throw new NotFoundException("One or more files not found");
    }
    for (const file of files) {
      if (!!allowedFileTypes && !allowedFileTypes.includes(file.fileType)) {
        throw new UnauthorizedException(
          `You do not have permission to delete these files`
        );
      }
      file.deletedAt = new Date();
    }

    await this.shopFileRepository.save(files);

    return { message: "Files deleted successfully" };
  }

  private getMaxActiveFiles(fileType: FileType): number {
    const maxActiveFilesMap: Record<FileType, number> = {
      [FileType.LOGO]: 1,
      [FileType.BANNER]: 2,
      [FileType.VIDEO]: 1,
      [FileType.DOC]: 1,
      [FileType.CONTRACT]: 1,
    };

    return maxActiveFilesMap[fileType] || 1;
  }

  async findShopFilesByType(shopId: number, getShopFilesDto: GetShopFilesDto) {
    const { fileType } = getShopFilesDto;

    const shop = await this.findOneById(shopId);

    const files = await this.shopFileRepository.find({
      where: { shopId: shop.id, fileType },
      select: ["id", "fileType", "fileUrl", "isActive", "createdAt"],
    });

    return {
      message: "shop file list received successfully",
      files,
    };
  }

  async findShopDocsByType(shopId: number, getShopDocsDto: GetShopDocsDto) {
    const { fileType } = getShopDocsDto;

    const shop = await this.findOneById(shopId);

    const documents = await this.shopFileRepository.find({
      where: { shopId: shop.id, fileType },
      select: ["id", "fileType", "fileUrl", "isActive", "createdAt"],
    });

    return {
      message: "shop document list received successfully",
      documents,
    };
  }

  private getMaxFilesAllowed(fileType: FileType): number {
    switch (fileType) {
      case FileType.BANNER:
        return 6;
      case FileType.DOC:
      case FileType.CONTRACT:
        return 1;
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
      case FileType.DOC:
      case FileType.CONTRACT:
        return {
          validMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/pdf",
          ],
          maxSize: 10 * 1000 * 1000,
        };
      case FileType.BANNER:
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
