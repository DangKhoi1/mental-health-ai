import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Permission } from '../../common/decorators';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('avatar')
  @Permission('Upload avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const url = await this.uploadService.uploadAvatar(file);
    return { avatarUrl: url };
  }

  @Post('resource-thumbnail')
  @Permission('Upload resource thumbnail')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async uploadResourceThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const url = await this.uploadService.uploadResourceThumbnail(file);
    return { thumbnailUrl: url };
  }
}
