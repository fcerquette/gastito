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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, MarkSplitPaidDto } from './expenses.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get('groups/:groupId/expenses')
  list(@CurrentUser() user: User, @Param('groupId') groupId: string) {
    return this.service.listByGroup(groupId, user.id);
  }

  @Post('groups/:groupId/expenses')
  create(
    @CurrentUser() user: User,
    @Param('groupId') groupId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.service.create(groupId, user.id, dto);
  }

  @Delete('expenses/:id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(id, user.id);
  }

  @Patch('expense-splits/:id')
  setPaid(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: MarkSplitPaidDto,
  ) {
    return this.service.setSplitPaid(id, user.id, dto.isPaid ?? true);
  }
}
