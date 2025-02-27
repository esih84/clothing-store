import { ApiProperty } from "@nestjs/swagger";
import { FileType } from "../enums/shop-file-type.enum";
import { IsEnum } from "class-validator";

export class FileUploadDto {
  @ApiProperty({
    type: "array",
    items: { type: "string", format: "binary" },
    maxItems: 3,
  })
  files: Express.Multer.File[];
  @ApiProperty({ enum: FileType })
  @IsEnum(FileType)
  fileType: FileType;
}
