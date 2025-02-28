import {
  Controller,
  Body,
  Post,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  Get,
} from "@nestjs/common";
import { ShopService } from "./shop.service";
import { CreateShopDto } from "./dto/create-shop.dto";
import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { Auth } from "src/common/decorators/auth.decorator";
import { RoleNames } from "../role/enums/role.enum";
import { SendOtpDto } from "../auth/dto/send-otp.dto";
import { VerifyOtpDto } from "../auth/dto/verify-otp.dto";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";
import { FileUploadDto } from "./dto/file-upload.dto";

@Controller("shop")
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: "Create shop" })
  @ApiResponse({ status: 200, description: "Shop created successfully" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopService.create(createShopDto);
  }
  @Post("/:shopId/sendOtp")
  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @ApiOperation({ summary: "send otp to shop mobile" })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  sendShopOtp(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Body() sendOtpDto: SendOtpDto
  ) {
    return this.shopService.sendShopOtp(shopId, sendOtpDto);
  }
  @Post("/:shopId/verifyPhone")
  @Auth(RoleNames.ADMIN, RoleNames.ADMIN_SHOP)
  @ApiOperation({ summary: "send otp to shop mobile" })
  @ApiResponse({ status: 200, description: "OTP sent successfully" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  verifyShopOtp(
    @Param("shopId", ParseIntPipe) shopId: number,
    @Body() verifyOtpDto: VerifyOtpDto
  ) {
    return this.shopService.verifyShopOtp(shopId, verifyOtpDto);
  }
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
    return this.shopService.UploadFile(shopId, fileUploadDto, files.files);
  }
  @Auth()
  @ApiOperation({ summary: "show all user stores" })
  @ApiResponse({
    status: 200,
    description: "User stores were successfully found.",
  })
  @Get("/find-all-user-shops")
  findAllUserShops() {
    return this.shopService.findAllUserShops();
  }
}
