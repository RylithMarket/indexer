import { Test, TestingModule } from '@nestjs/testing';
import { CetusService } from './cetus.service';

describe('CetusService', () => {
  let service: CetusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CetusService],
    }).compile();

    service = module.get<CetusService>(CetusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
