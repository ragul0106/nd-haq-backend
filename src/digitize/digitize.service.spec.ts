import { Test, TestingModule } from '@nestjs/testing';
import { DigitizeService } from './digitize.service';

describe('DigitizeService', () => {
  let service: DigitizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DigitizeService],
    }).compile();

    service = module.get<DigitizeService>(DigitizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
