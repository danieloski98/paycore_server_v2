import { Test, TestingModule } from '@nestjs/testing';
import { WithrawalController } from './withrawal.controller';

describe('WithrawalController', () => {
  let controller: WithrawalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithrawalController],
    }).compile();

    controller = module.get<WithrawalController>(WithrawalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
