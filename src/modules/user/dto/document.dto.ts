import { ApiProperty } from "@nestjs/swagger";

export class UploadUserNationalCardDto {
  @ApiProperty({ type: "string", format: "binary" })
  card: Express.Multer.File;
}
