import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Role } from '@prisma/client';

// We intentionally do NOT extend PartialType(CreateUserDto) because
// CreateUserDto marks `password` as required (MinLength 6, no @IsOptional).
// On update, password must be truly optional – omit it to keep the existing one.

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Completely optional on update; only validated when actually supplied.
  @ApiPropertyOptional({ example: 'newPassword123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.STAFF })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: { billing: { view: true, edit: false } } })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;
}
