import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DailyReportsService } from './daily-reports.service';

describe('DailyReportsService', () => {
  let service: DailyReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyReportsService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DailyReportsService>(DailyReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
