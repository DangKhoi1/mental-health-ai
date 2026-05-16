import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Journal } from './entities';
import { JournalImage } from './entities/journal-image.entity';
import { User } from '../user/entities';
import { UploadService } from '../upload/upload.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(JournalImage)
    private journalImageRepository: Repository<JournalImage>,
    private uploadService: UploadService,
  ) {}

  async createJournal(user: User, createJournalDto: CreateJournalDto) {
    try {
      const journal = this.journalRepository.create({
        ...createJournalDto,
        user,
      });
      const saved = await this.journalRepository.save(journal);

      return {
        EC: 1,
        EM: 'Journal created successfully',
        ...saved,
      };
    } catch (error: unknown) {
      console.error(
        'Error in createJournal:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createJournal service',
      });
    }
  }

  async getAllJournals(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const where = search?.trim()
        ? [
            {
              user: { userId },
              title: ILike(`%${search.trim()}%`),
              isDeleted: false,
            },
            {
              user: { userId },
              content: ILike(`%${search.trim()}%`),
              isDeleted: false,
            },
          ]
        : { user: { userId }, isDeleted: false };

      const [journals, total] = await this.journalRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        take: safeLimit,
        skip,
      });

      return {
        EC: 1,
        EM: 'Get journals successfully',
        journals,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getAllJournals:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllJournals service',
      });
    }
  }

  async getTrashedJournals(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const [journals, total] = await this.journalRepository.findAndCount({
        where: { user: { userId }, isDeleted: true },
        order: { deletedAt: 'DESC' },
        take: safeLimit,
        skip,
      });

      return {
        EC: 1,
        EM: 'Get trashed journals successfully',
        journals,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getTrashedJournals:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getTrashedJournals service',
      });
    }
  }

  async getJournalById(id: string, userId: string) {
    try {
      const journal = await this.journalRepository.findOne({
        where: { journalId: id, user: { userId }, isDeleted: false },
        relations: ['analysisResult'],
      });

      if (!journal) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Journal not found',
        });
      }

      return {
        EC: 1,
        EM: 'Get journal successfully',
        ...journal,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        'Error in getJournalById:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getJournalById service',
      });
    }
  }

  async updateJournal(id: string, user: User, updateDto: UpdateJournalDto) {
    try {
      const journal = await this.journalRepository.findOne({
        where: {
          journalId: id,
          user: { userId: user.userId },
          isDeleted: false,
        },
      });

      if (!journal) {
        throw new NotFoundException({ EC: 0, EM: 'Journal not found' });
      }

      Object.assign(journal, updateDto);
      await this.journalRepository.save(journal);

      return {
        EC: 1,
        EM: 'Journal updated successfully',
        journal,
      };
    } catch (error: unknown) {
      console.error(
        'Error in updateJournal:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateJournal service',
      });
    }
  }

  async deleteJournal(journalId: string, user: User) {
    try {
      const journal = await this.journalRepository.findOne({
        where: { journalId, user: { userId: user.userId }, isDeleted: false },
      });

      if (!journal) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Journal not found',
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const createdAtDate = new Date(journal.createdAt);
      createdAtDate.setHours(0, 0, 0, 0);

      if (createdAtDate.getTime() === today.getTime()) {
        return {
          EC: 0,
          EM: 'Không thể xóa bản ghi tạo trong ngày hiện tại. Vui lòng sử dụng chức năng Sửa (Cập nhật).',
        };
      }

      journal.isDeleted = true;
      journal.deletedAt = new Date();
      await this.journalRepository.save(journal);

      return {
        EC: 1,
        EM: 'Journal deleted successfully',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        'Error in deleteJournal:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteJournal service',
      });
    }
  }

  async restoreJournal(id: string, user: User) {
    try {
      const journal = await this.journalRepository.findOne({
        where: {
          journalId: id,
          user: { userId: user.userId },
          isDeleted: true,
        },
      });

      if (!journal) {
        throw new NotFoundException({ EC: 0, EM: 'Deleted journal not found' });
      }

      journal.isDeleted = false;
      journal.deletedAt = null;
      await this.journalRepository.save(journal);

      return {
        EC: 1,
        EM: 'Journal restored successfully',
      };
    } catch (error: unknown) {
      console.error(
        'Error in restoreJournal:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from restoreJournal service',
      });
    }
  }

  async uploadJournalImage(
    journalId: string,
    user: User,
    file: Express.Multer.File,
  ) {
    try {
      const journal = await this.journalRepository.findOne({
        where: {
          journalId,
          user: { userId: user.userId },
          isDeleted: false,
        },
      });

      if (!journal) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Journal not found',
        });
      }

      if (!file) {
        throw new BadRequestException({
          EC: 0,
          EM: 'No file provided',
        });
      }

      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Only image files are allowed (JPEG, PNG, WebP, GIF)',
        });
      }

      const maxFileSize = 5 * 1024 * 1024; 
      if (file.size > maxFileSize) {
        throw new BadRequestException({
          EC: 0,
          EM: 'File size must not exceed 5MB',
        });
      }

      const uploadResult = await this.uploadService.uploadJournalImage(file);

      const lastImage = await this.journalImageRepository.findOne({
        where: { journalId },
        order: { displayOrder: 'DESC' },
      });

      const displayOrder = (lastImage?.displayOrder ?? -1) + 1;

      const journalImage = this.journalImageRepository.create({
        journalId,
        fileName: file.originalname,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        mimeType: file.mimetype,
        fileSize: file.size,
        displayOrder,
      });

      await this.journalImageRepository.save(journalImage);

      return {
        EC: 1,
        EM: 'Image uploaded successfully',
        imageId: journalImage.imageId,
        cloudinaryUrl: journalImage.cloudinaryUrl,
      };
    } catch (error: unknown) {
      console.error(
        'Error in uploadJournalImage:',
        error instanceof Error ? error.message : String(error),
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from uploadJournalImage service',
      });
    }
  }

  async deleteJournalImage(imageId: string, user: User) {
    try {
      const journalImage = await this.journalImageRepository.findOne({
        where: { imageId },
        relations: ['journal', 'journal.user'],
      });

      if (!journalImage) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Image not found',
        });
      }

      if (
        !journalImage.journal ||
        !journalImage.journal.user ||
        journalImage.journal.user.userId !== user.userId
      ) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Unauthorized to delete this image',
        });
      }

      if (journalImage.cloudinaryPublicId) {
        await this.uploadService.deleteJournalImage(
          journalImage.cloudinaryPublicId,
        );
      }

      await this.journalImageRepository.delete(imageId);

      const remainingImages = await this.journalImageRepository.find({
        where: { journalId: journalImage.journalId },
        order: { displayOrder: 'ASC' },
      });

      for (let i = 0; i < remainingImages.length; i++) {
        remainingImages[i].displayOrder = i;
        await this.journalImageRepository.save(remainingImages[i]);
      }

      return {
        EC: 1,
        EM: 'Image deleted successfully',
      };
    } catch (error: unknown) {
      console.error(
        'Error in deleteJournalImage:',
        error instanceof Error ? error.message : String(error),
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteJournalImage service',
      });
    }
  }

  async getJournalImages(journalId: string, user: User) {
    try {
      const journal = await this.journalRepository.findOne({
        where: {
          journalId,
          user: { userId: user.userId },
          isDeleted: false,
        },
        relations: ['images'],
      });

      if (!journal) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Journal not found',
        });
      }

      return {
        EC: 1,
        EM: 'Get images successfully',
        images: journal.images.sort((a, b) => a.displayOrder - b.displayOrder),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getJournalImages:',
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getJournalImages service',
      });
    }
  }
}
