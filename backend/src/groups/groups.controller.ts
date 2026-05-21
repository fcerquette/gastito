import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { GroupsService } from './groups.service';
import {
  AddMemberDto,
  CreateGroupDto,
  UpdateGroupDto,
  UpdateMemberDto,
} from './groups.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private service: GroupsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.service.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateGroupDto) {
    return this.service.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(id, user.id);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.addMember(id, user.id, dto);
  }

  @Patch(':id/members/:memberId')
  updateMember(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.service.updateMember(id, user.id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.service.removeMember(id, user.id, memberId);
  }
}
