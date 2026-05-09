import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './settlements.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class SettlementsController {
  constructor(private service: SettlementsService) {}

  @Get('groups/:groupId/settlements')
  list(@CurrentUser() user: User, @Param('groupId') groupId: string) {
    return this.service.listByGroup(groupId, user.id);
  }

  @Post('groups/:groupId/settlements')
  create(
    @CurrentUser() user: User,
    @Param('groupId') groupId: string,
    @Body() dto: CreateSettlementDto,
  ) {
    return this.service.create(groupId, user.id, dto);
  }

  @Delete('settlements/:id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(id, user.id);
  }
}
