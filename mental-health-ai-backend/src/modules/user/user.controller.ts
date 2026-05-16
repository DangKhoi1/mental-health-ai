import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Delete,
  Query,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  SetPrivacyPinDto,
  VerifyPrivacyPinDto,
  RemovePrivacyPinDto,
} from './dto/privacy-pin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { CurrentUser, Permission, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { User } from './entities';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permission('Get all users')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.userService.getAllUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
    );
  }

  @Get('me')
  @Permission('Get my profile')
  getMyProfile(@CurrentUser() user: User) {
    return this.userService.getUserProfile(user.userId);
  }

  @Get('me/health-summary')
  @Permission('Get health summary')
  getHealthSummary(@CurrentUser() user: User) {
    console.log('[UserController] Accessing health-summary endpoint');
    return this.userService.getHealthSummary(user.userId);
  }

  @Get('me/privacy-pin/status')
  @Permission('Get privacy pin status')
  getPrivacyPinStatus(@CurrentUser() user: User) {
    return this.userService.hasPrivacyPin(user.userId);
  }

  @Post('me/privacy-pin/set')
  @Permission('Set privacy pin')
  setPrivacyPin(@CurrentUser() user: User, @Body() dto: SetPrivacyPinDto) {
    return this.userService.setPrivacyPin(user.userId, dto.pin);
  }

  @Post('me/privacy-pin/verify')
  @Permission('Verify privacy pin')
  verifyPrivacyPin(
    @CurrentUser() user: User,
    @Body() dto: VerifyPrivacyPinDto,
  ) {
    return this.userService.verifyPrivacyPin(user.userId, dto.pin);
  }

  @Delete('me/privacy-pin')
  @Permission('Remove privacy pin')
  removePrivacyPin(
    @CurrentUser() user: User,
    @Body() dto: RemovePrivacyPinDto,
  ) {
    return this.userService.removePrivacyPin(user.userId, dto.pin);
  }

  @Get(':id')
  @Permission('Get user by ID')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserProfile(id);
  }

  @Patch('profile/:id')
  @Permission('Update profile')
  updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: User,
  ) {
    return this.userService.updateProfile(id, updateProfileDto, user);
  }

  @Patch('change-password')
  @Permission('Update profile')
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Delete('me')
  @Permission('Update profile')
  deleteOwnAccount(@CurrentUser() user: User, @Body() dto: DeleteAccountDto) {
    return this.userService.deleteOwnAccount(user.userId, dto.password);
  }

  @Delete(':id')
  @Permission('Deactivate user')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  deactivateUser(@Param('id') id: string) {
    return this.userService.deactivateUser(id);
  }
}
