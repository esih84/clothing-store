import { Injectable } from "@nestjs/common";
import * as AWS from "aws-sdk";

import { extname } from "path";

@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
      endpoint: process.env.s3_ENDPOINT,
      region: "default",
    });
  }

  async uploadFile(file: Express.Multer.File, folderName: string) {
    const ext = extname(file.originalname);
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${folderName}/${Date.now()}.${ext}`,
      Body: file.buffer,
    };

    try {
      return await this.s3.upload(uploadParams).promise();
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  async deleteFile(Key: string) {
    return await this.s3
      .deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: decodeURI(Key),
      })
      .promise();
  }
}
