import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Currency } from '../common/entities/group.entity';

const CURRENCIES: Currency[] = ['ARS', 'USD', 'BRL', 'EUR'];

export type SplitMode = 'equal' | 'amounts' | 'percentages';

export class SplitInputDto {
  /** ID del GroupMember (no del User) */
  @IsUUID()
  groupMemberId: string;

  /**
   * Si splitMode = 'equal' → ignorado (se calcula).
   * Si splitMode = 'amounts' → monto exacto.
   * Si splitMode = 'percentages' → porcentaje (0-100).
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;
}

export class CreateExpenseDto {
  @IsString()
  @MaxLength(200)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsIn(CURRENCIES)
  currency: Currency;

  @IsUUID()
  paidById: string;

  @IsDateString()
  date: string;

  @IsIn(['equal', 'amounts', 'percentages'])
  splitMode: SplitMode;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SplitInputDto)
  splits: SplitInputDto[];
}

export class MarkSplitPaidDto {
  @IsOptional()
  isPaid?: boolean;
}
