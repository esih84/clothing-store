import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, Length } from "class-validator";
import { blogStatus } from "../types/blog.type";

export class CreateBlogDto {
  @ApiProperty()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;
  @ApiProperty()
  @IsNotEmpty()
  @Length(10, 300)
  description: string;
  @ApiPropertyOptional()
  slug: string;
  @ApiProperty()
  @Length(100)
  @IsNotEmpty()
  content: string;
  @ApiProperty({ type: "string", format: "binary" })
  image: Express.Multer.File;
  @ApiProperty({ enum: blogStatus, default: blogStatus.DRAFT })
  status: blogStatus;
  @ApiProperty({ type: String, isArray: true })
  categories: string[] | string;
}

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
