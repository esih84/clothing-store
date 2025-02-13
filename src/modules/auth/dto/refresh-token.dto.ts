import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenDto {
  @ApiProperty({
    example: "refresh-token-string",
    description: "Refresh token",
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
