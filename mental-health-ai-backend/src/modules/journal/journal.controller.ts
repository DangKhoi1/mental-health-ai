import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { CurrentUser, Permission } from '../../common/decorators';
import { PrivacyJournalGuard } from '../../common/guards';
import { User } from '../user/entities';

@Controller('journals')
@UseGuards(AuthGuard('jwt'), PrivacyJournalGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post('create-journal')
  @Permission('Create journal')
  createJournal(
    @CurrentUser() user: User,
    @Body() createJournalDto: CreateJournalDto,
  ) {
    return this.journalService.createJournal(user, createJournalDto);
  }

  @Get('get-all-journals')
  @Permission('Get all journals')
  getAllJournals(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.journalService.getAllJournals(
      user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
    );
  }

  @Get('trashed')
  @Permission('Get all journals deleted')
  getTrashedJournals(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.journalService.getTrashedJournals(
      user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('get-journal-by-id/:id')
  @Permission('Get journal by ID')
  getJournalById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.journalService.getJournalById(id, user.userId);
  }

  @Delete('delete-journal/:id')
  @Permission('Delete journal')
  deleteJournal(@Param('id') journalId: string, @CurrentUser() user: User) {
    return this.journalService.deleteJournal(journalId, user);
  }

  @Put('update-journal/:id')
  @Permission('Update journal')
  updateJournal(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateJournalDto,
  ) {
    return this.journalService.updateJournal(id, user, updateDto);
  }

  @Put('restore-journal/:id')
  @Permission('Restore journal')
  restoreJournal(@Param('id') id: string, @CurrentUser() user: User) {
    return this.journalService.restoreJournal(id, user);
  }

  @Post(':journalId/upload-image')
  @Permission('Create journal')
  @UseInterceptors(FileInterceptor('file'))
  uploadJournalImage(
    @Param('journalId') journalId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException({
        EC: 0,
        EM: 'No file provided',
      });
    }
    return this.journalService.uploadJournalImage(journalId, user, file);
  }

  @Get(':journalId/images')
  @Permission('Get journal by ID')
  getJournalImages(
    @Param('journalId') journalId: string,
    @CurrentUser() user: User,
  ) {
    return this.journalService.getJournalImages(journalId, user);
  }

  @Delete('delete-image/:imageId')
  @Permission('Delete journal')
  deleteJournalImage(
    @Param('imageId') imageId: string,
    @CurrentUser() user: User,
  ) {
    return this.journalService.deleteJournalImage(imageId, user);
  }
}
