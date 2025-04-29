import { Test, TestingModule } from '@nestjs/testing';
import { DigitizeController } from './digitize.controller';

describe('DigitizeController', () => {
  let controller: DigitizeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DigitizeController],
    }).compile();

    controller = module.get<DigitizeController>(DigitizeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
