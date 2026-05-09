import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency } from '../common/entities/group.entity';

const CURRENCIES: Currency[] = ['ARS', 'USD', 'BRL', 'EUR'];

export class InvitedMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsIn(CURRENCIES)
  defaultCurrency?: Currency;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvitedMemberDto)
  members?: InvitedMemberDto[];
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsIn(CURRENCIES)
  defaultCurrency?: Currency;
}

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
