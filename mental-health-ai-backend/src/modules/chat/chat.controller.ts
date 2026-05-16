import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser, Permission } from '../../common/decorators';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @Permission('Create chat session')
  createSession(@CurrentUser() user: User) {
    return this.chatService.createSession(user);
  }

  @Get('sessions')
  @Permission('Get chat sessions')
  getSessions(@CurrentUser() user: User) {
    return this.chatService.getSessions(user.userId);
  }

  @Get('sessions/:id/messages')
  @Permission('Get chat messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: User) {
    return this.chatService.getMessages(id, user.userId);
  }

  @Post('sessions/:id/messages')
  @Permission('Send chat message')
  sendMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('context') context: Record<string, unknown>,
    @CurrentUser() user: User,
  ) {
    return this.chatService.sendMessage(id, content, user, context);
  }

  @Delete('sessions/:id')
  @Permission('Delete chat session')
  deleteSession(@Param('id') id: string, @CurrentUser() user: User) {
    return this.chatService.deleteSession(id, user.userId);
  }
}
