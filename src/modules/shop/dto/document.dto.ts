import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { FileType } from "../enums/shop-file-type.enum";

export class UploadShopDocumentDto {
  @ApiProperty({ type: "string", format: "binary" })
  doc: Express.Multer.File;
}

export class UploadShopContractDto {
  @ApiProperty({ type: "string", format: "binary" })
  contract: Express.Multer.File;
}

export class GetShopDocsDto {
  @ApiProperty({ enum: [FileType.CONTRACT, FileType.DOC] })
  @IsEnum(FileType)
  fileType: FileType.CONTRACT | FileType.DOC;
}
