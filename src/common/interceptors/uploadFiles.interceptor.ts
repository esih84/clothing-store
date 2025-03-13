import { FileFieldsInterceptor } from "@nestjs/platform-express";

import { MulterField } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { memoryStorage } from "multer";

export function UploadFilesInterceptor(
  uploadFields: MulterField[],
  allowedMimeTypes: string[] = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "image/jpg",
  ]
) {
  return FileFieldsInterceptor(uploadFields, {
    storage: memoryStorage(),

    fileFilter: (req, file, callback) => {
      if (!allowedMimeTypes.includes(file.mimetype))
        callback(new Error("Invalid file type"), false);

      callback(null, true);
    },
  });
}
