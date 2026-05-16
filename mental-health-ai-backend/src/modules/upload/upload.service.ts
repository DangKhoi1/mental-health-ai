import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

interface UploadJournalImageResult {
  secure_url: string;
  public_id: string;
}

@Injectable()
export class UploadService {
  async uploadAvatar(file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (!file.path) {
        throw new BadRequestException('File path is missing');
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'avatars',
        width: 256,
        height: 256,
        crop: 'fill',
      });

      return result.secure_url;
    } catch (error: unknown) {
      throw new BadRequestException(
        `Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async uploadResourceThumbnail(file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (!file.path) {
        throw new BadRequestException('File path is missing');
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'resources',
        width: 800,
        height: 600,
        crop: 'limit',
      });

      return result.secure_url;
    } catch (error: unknown) {
      throw new BadRequestException(
        `Failed to upload resource thumbnail: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async uploadJournalImage(
    file: Express.Multer.File,
  ): Promise<UploadJournalImageResult> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (!file.buffer) {
        throw new BadRequestException('File buffer is missing');
      }

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'journals',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              reject(
                new BadRequestException(
                  `Failed to upload journal image: ${error.message}`,
                ),
              );
            } else if (result) {
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          },
        );

        const stream = Readable.from(file.buffer);
        stream.pipe(uploadStream);
      });
    } catch (error: unknown) {
      throw new BadRequestException(
        `Failed to upload journal image: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async deleteJournalImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: unknown) {
      throw new BadRequestException(
        `Failed to delete journal image: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
