import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Currency } from '../common/entities/group.entity';

const CURRENCIES: Currency[] = ['ARS', 'USD', 'BRL', 'EUR'];

export class CreateSettlementDto {
  @IsUUID()
  fromMemberId: string;

  @IsUUID()
  toMemberId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsIn(CURRENCIES)
  currency: Currency;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
