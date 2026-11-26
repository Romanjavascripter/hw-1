import { RemoveFilePayloadDto } from './dto/remove-file-payload.dto.js';
import { UploadFilePayloadDto } from './dto/upload-file-payload.dto.js';
import { UploadFileResultDto } from './dto/upload-file-result.dto.js';

export abstract class IFileService {
  abstract uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto>;
  abstract removeFile(dto: RemoveFilePayloadDto): Promise<void>;
}
