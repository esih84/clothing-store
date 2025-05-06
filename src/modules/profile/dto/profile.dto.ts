import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsDateString } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: "string", format: "binary" })
  avatar: Express.Multer.File;

  @ApiPropertyOptional({ example: "1990-01-01" })
  @IsOptional()
  @IsDateString()
  birthday?: string;
}
