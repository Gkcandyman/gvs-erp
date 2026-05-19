import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '123 Acme Way' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'North Zone' })
  @IsOptional()
  @IsString()
  zone?: string;
}
