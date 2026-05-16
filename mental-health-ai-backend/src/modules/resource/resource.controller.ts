import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { CurrentUser, Permission, Roles } from '../../common/decorators';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';

@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  @Permission('Get all resources')
  findAll(
    @CurrentUser() user: User,
    @Query('all') all?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    const wantsAll = all === 'true';
    const isAdmin = user.role?.roleName === 'Admin';

    if (wantsAll && !isAdmin) {
      throw new ForbiddenException({
        EC: 0,
        EM: "You don't have permission to access this resource",
      });
    }

    return this.resourceService.findAll(
      !wantsAll,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
      search,
      category,
    );
  }

  @Get(':id')
  @Permission('Get resource by ID')
  findOne(@Param('id') id: string) {
    return this.resourceService.findOne(id);
  }

  @Post()
  @Permission('Create resource')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  create(@Body() createDto: CreateResourceDto, @CurrentUser() user: User) {
    return this.resourceService.create(createDto, user);
  }

  @Patch(':id')
  @Permission('Update resource')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  update(@Param('id') id: string, @Body() updateDto: UpdateResourceDto) {
    return this.resourceService.update(id, updateDto);
  }

  @Delete(':id')
  @Permission('Delete resource')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.resourceService.remove(id);
  }
}
