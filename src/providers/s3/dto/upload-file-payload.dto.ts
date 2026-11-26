export class UploadFilePayloadDto {
  folder: string;
  name: string;
  file: Express.Multer.File;
}
