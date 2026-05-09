import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { BalancesService } from './balances.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class BalancesController {
  constructor(private service: BalancesService) {}

  @Get('groups/:groupId/balances')
  get(@CurrentUser() user: User, @Param('groupId') groupId: string) {
    return this.service.getGroupBalances(groupId, user.id);
  }
}
