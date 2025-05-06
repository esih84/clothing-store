import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/profile.dto";
import { Auth } from "src/common/decorators/auth.decorator";
import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SwaggerConsumes } from "src/common/enums/swagger-consumes.enum";
import { UploadFilesInterceptor } from "src/common/interceptors/uploadFiles.interceptor";

@Controller("profile")
@Auth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findUserProfile() {
    return this.profileService.findUserProfile();
  }

  @Get(":userId")
  findOne(@Param("userId", ParseIntPipe) userId: number) {
    return this.profileService.findOneByUserId(userId);
  }

  @Auth()
  @ApiOperation({ summary: "update profile" })
  @ApiResponse({
    status: 200,
    description: "profile updated successfully.",
  })
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @Patch("update-profile")
  @UseInterceptors(
    UploadFilesInterceptor(
      [{ name: "avatar", maxCount: 1 }],
      ["image/jpeg", "image/png", "image/jpg"]
    )
  )
  update(
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFiles() file: { avatar?: Express.Multer.File }
  ) {
    return this.profileService.update(updateProfileDto, file?.avatar);
  }
}
