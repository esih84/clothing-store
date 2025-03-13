import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateCategoryDto {
  @ApiProperty({ type: "string" })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name: string;

  @ApiProperty({ type: "string" })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  slug: string;

  @ApiProperty({ type: "string", format: "binary" })
  image: Express.Multer.File;

  @ApiProperty({ type: "boolean" })
  @IsBoolean({ message: "The show field must be a boolean value" })
  @Type(() => Boolean)
  show: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parentId?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
