import { ApiProperty } from "@nestjs/swagger";

export class UploadShopDocumentDto {
  @ApiProperty({ type: "string", format: "binary" })
  doc: Express.Multer.File;
}

export class UploadShopContractDto {
  @ApiProperty({ type: "string", format: "binary" })
  contract: Express.Multer.File;
}
