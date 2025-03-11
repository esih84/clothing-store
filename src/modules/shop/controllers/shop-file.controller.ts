import {
  Controller,
  Body,
  Post,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  Get,
  Patch,
  Query,
  Delete,
} from "@nestjs/common";
import { ShopFileService } from "../services/shop-file.service";

import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { Auth } from "src/common/decorators/auth.decorator";
import { RoleNames } from "../../role/enums/role.enum";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";
import {
  FileUploadDto,
  GetShopFilesDto,
  ToggleFilesDto,
} from "../dto/file.dto";
import { FileType } from "../enums/shop-file-type.enum";
import {
  GetShopDocsDto,
  UploadShopContractDto,
  UploadShopDocumentDto,
} from "../dto/document.dto";

@Controller("shop-file")
export class ShopFileController {
  constructor(private readonly shopFileService: ShopFileService) {}

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Post("/:shopId/upload-file")
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @UseInterceptors(UploadFilesInterceptor([{ name: "files", maxCount: 10 }]))
  uploadFiles(
    @Body() fileUploadDto: FileUploadDto,
    @UploadedFiles()
    files: { files: Express.Multer.File[] },
    @Param("shopId", ParseIntPipe) shopId: number
  ) {
    return this.shopFileService.UploadFile(
      shopId,
      fileUploadDto.fileType,
      files.files
    );
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Patch("/:shopId/files/toggle-activation")
  @ApiOperation({ summary: "Toggle activation for multiple files" })
  @ApiResponse({
    status: 200,
    description: "Files status updated successfully.",
  })
  @ApiResponse({ status: 404, description: "One or more files not found." })
  @ApiResponse({ status: 400, description: "File activation limit exceeded." })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async toggleFilesActivation(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Body() toggleFilesDto: ToggleFilesDto
  ) {
    return this.shopFileService.toggleFilesActivationGeneric(
      shopId,
      toggleFilesDto,
      [FileType.VIDEO, FileType.LOGO, FileType.BANNER]
    );
  }

  @Auth(RoleNames.ADMIN)
  @Patch("/admin/:shopId/files/toggle-activation")
  @ApiOperation({ summary: "Toggle activation for multiple files" })
  @ApiResponse({
    status: 200,
    description: "Files status updated successfully.",
  })
  @ApiResponse({ status: 404, description: "One or more files not found." })
  @ApiResponse({ status: 400, description: "File activation limit exceeded." })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async toggleFilesActivationAdmin(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Body() toggleFilesDto: ToggleFilesDto
  ) {
    return this.shopFileService.toggleFilesActivationGeneric(
      shopId,
      toggleFilesDto
    );
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Delete("/:shopId/files/delete")
  @ApiOperation({ summary: "Delete files" })
  @ApiResponse({
    status: 200,
    description: "Files deleted successfully.",
  })
  @ApiResponse({ status: 404, description: "One or more files not found." })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  SoftDeleteFiles(
    @Param("shopId") shopId: number,
    @Body() deleteFilesDto: ToggleFilesDto
  ) {
    return this.shopFileService.SoftDeleteFiles(shopId, deleteFilesDto, [
      FileType.VIDEO,
      FileType.LOGO,
      FileType.BANNER,
    ]);
  }

  @Auth(RoleNames.ADMIN)
  @Delete("/admin/:shopId/files/SoftDelete")
  @ApiOperation({ summary: "Delete files by admin" })
  @ApiResponse({
    status: 200,
    description: "Files deleted successfully.",
  })
  @ApiResponse({ status: 404, description: "One or more files not found." })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  SoftDeleteFilesByAdmin(
    @Param("shopId") shopId: number,
    @Body() deleteFilesDto: ToggleFilesDto
  ) {
    return this.shopFileService.SoftDeleteFiles(shopId, deleteFilesDto);
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Post("/:shopId/upload-document")
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @ApiBody({ type: UploadShopDocumentDto })
  @UseInterceptors(UploadFilesInterceptor([{ name: "doc", maxCount: 1 }]))
  uploadShopDocument(
    @UploadedFiles()
    files: { doc: Express.Multer.File[] },
    @Param("shopId", ParseIntPipe) shopId: number
  ) {
    return this.shopFileService.UploadFile(shopId, FileType.DOC, files.doc);
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Post("/:shopId/upload-contract")
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @ApiBody({ type: UploadShopContractDto })
  @UseInterceptors(UploadFilesInterceptor([{ name: "contract", maxCount: 1 }]))
  registerContract(
    @UploadedFiles()
    files: { contract: Express.Multer.File[] },
    @Param("shopId", ParseIntPipe) shopId: number
  ) {
    return this.shopFileService.UploadFile(
      shopId,
      FileType.CONTRACT,
      files.contract
    );
  }

  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @Get("/:shopId/files")
  @ApiOperation({ summary: "get shop files based on file type" })
  @ApiResponse({
    status: 200,
    description: "shop file list received successfully",
  })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  findShopFilesByType(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Query() getShopFilesDto: GetShopFilesDto
  ) {
    return this.shopFileService.findShopFilesByType(shopId, getShopFilesDto);
  }

  @Auth(RoleNames.ADMIN)
  @Get("/:shopId/docs")
  @ApiOperation({ summary: "get shop docs based on file type" })
  @ApiResponse({
    status: 200,
    description: "shop document list received successfully",
  })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  findShopDocsByType(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Query() getShopDocsDto: GetShopDocsDto
  ) {
    return this.shopFileService.findShopDocsByType(shopId, getShopDocsDto);
  }
}
