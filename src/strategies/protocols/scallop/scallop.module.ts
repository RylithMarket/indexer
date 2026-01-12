import { Module } from '@nestjs/common';
import { ScallopService } from './scallop.service';

@Module({
  providers: [ScallopService]
})
export class ScallopModule {}
