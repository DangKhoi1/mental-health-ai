import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Resource } from './entities';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { User } from '../user/entities';

@Injectable()
export class ResourceService {
  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
  ) {}

  async create(createDto: CreateResourceDto, user: User) {
    try {
      const resource = this.resourceRepository.create({
        ...createDto,
        createdByUser: user,
      });
      const saved = await this.resourceRepository.save(resource);
      return {
        EC: 1,
        EM: 'Tạo tài nguyên thành công',
        resource: saved,
      };
    } catch (error: unknown) {
      console.error(
        'Error in createResource:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi tạo tài nguyên',
      });
    }
  }

  async findAll(
    activeOnly: boolean = true,
    page: number = 1,
    limit: number = 12,
    search?: string,
    category?: string,
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 12;
      const skip = (safePage - 1) * safeLimit;

      const searchTerm = search?.trim();
      const normalizedCategory = category?.trim();
      const baseWhere: Record<string, unknown> = {};
      if (activeOnly) {
        baseWhere.isActive = true;
      }
      if (normalizedCategory && normalizedCategory !== 'all') {
        baseWhere.categoryCode = normalizedCategory;
      }

      const where = searchTerm
        ? [
            {
              ...baseWhere,
              title: ILike(`%${searchTerm}%`),
            },
            {
              ...baseWhere,
              description: ILike(`%${searchTerm}%`),
            },
          ]
        : baseWhere;

      const [resources, total] = await this.resourceRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        take: safeLimit,
        skip,
      });
      return {
        EC: 1,
        EM: 'Lấy danh sách tài nguyên thành công',
        resources,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in findAllResources:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi lấy danh sách tài nguyên',
      });
    }
  }

  async findOne(id: string) {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { resourceId: id },
      });
      if (!resource) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy tài nguyên',
        });
      }
      return {
        EC: 1,
        EM: 'Lấy tài nguyên thành công',
        resource,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error(
        'Error in findOneResource:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi lấy tài nguyên',
      });
    }
  }

  async update(id: string, updateDto: UpdateResourceDto) {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { resourceId: id },
      });
      if (!resource) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy tài nguyên',
        });
      }

      Object.assign(resource, updateDto);
      const updated = await this.resourceRepository.save(resource);

      return {
        EC: 1,
        EM: 'Cập nhật tài nguyên thành công',
        resource: updated,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error(
        'Error in updateResource:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi cập nhật tài nguyên',
      });
    }
  }

  async remove(id: string) {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { resourceId: id },
      });
      if (!resource) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy tài nguyên',
        });
      }

      await this.resourceRepository.remove(resource);
      return {
        EC: 1,
        EM: 'Xóa tài nguyên thành công',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      console.error(
        'Error in removeResource:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi xóa tài nguyên',
      });
    }
  }
}
