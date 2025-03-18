import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  Patch,
  Body,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { Auth } from "src/common/decorators/auth.decorator";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";
import { UploadUserNationalCardDto } from "./dto/document.dto";
import { UpdateUserIdentityDto } from "./dto/create-user.dto";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Auth()
  @Post("/upload-national-card")
  @ApiOperation({ summary: "Upload a user's national card" })
  @ApiResponse({
    status: 200,
    description: "User national card uploaded successfully",
  })
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @ApiBody({ type: UploadUserNationalCardDto })
  @UseInterceptors(
    UploadFilesInterceptor(
      [{ name: "card", maxCount: 1 }],
      ["image/jpeg", "image/png", "image/jpg"]
    )
  )
  uploadUserNationalCard(
    @UploadedFiles()
    files: {
      card: Express.Multer.File;
    }
  ) {
    return this.userService.uploadUserNationalCard(files.card);
  }

  @Auth() // یا می‌توانید نقش‌های لازم را مشخص کنید
  @Patch("identity")
  @ApiOperation({ summary: "Update user's real identity" })
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  @ApiResponse({
    status: 200,
    description: "User identity updated successfully.",
  })
  @ApiResponse({ status: 404, description: "User not found." })
  @ApiResponse({
    status: 403,
    description: "User has already uploaded all documents.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid real name or real family provided.",
  })
  async updateUserIdentity(
    @Body() updateUserIdentityDto: UpdateUserIdentityDto
  ) {
    return this.userService.updateUserIdentityDto(updateUserIdentityDto);
  }
}
