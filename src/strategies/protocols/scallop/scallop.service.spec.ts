import { Test, TestingModule } from '@nestjs/testing';
import { ScallopService } from './scallop.service';

describe('ScallopService', () => {
  let service: ScallopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScallopService],
    }).compile();

    service = module.get<ScallopService>(ScallopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
