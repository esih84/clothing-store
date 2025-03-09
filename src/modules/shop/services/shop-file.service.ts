import {
  Injectable,
  BadRequestException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { GetShopFilesDto, ToggleFilesDto } from "../dto/file.dto";
import { GetShopDocsDto } from "../dto/document.dto";
import { VerificationStatus } from "../enums/shop.enum";
import { ShopFile } from "../entities/shop-file.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeepPartial, In, Repository } from "typeorm";
import { FileType } from "../enums/shop-file-type.enum";
import { ShopService } from "./shop.service";
import { S3Service } from "src/modules/s3/s3.service";
import { Shop } from "../entities/shop.entity";
@Injectable()
export class ShopFileService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(ShopFile)
    private shopFileRepository: Repository<ShopFile>,
    private shopService: ShopService,
    private s3Service: S3Service,
    private dataSource: DataSource
  ) {}
  async UploadFile(
    shopId: number,
    fileType: FileType,
    files: Express.Multer.File[]
  ) {
    const shop = await this.shopService.findOneById(shopId);
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

    const shop = await this.shopService.findOneById(shopId);

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

    const shop = await this.shopService.findOneById(shopId);

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
}
