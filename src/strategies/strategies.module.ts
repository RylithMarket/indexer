import { Module } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { CetusModule } from './protocols/cetus/cetus.module';
import { ScallopModule } from './protocols/scallop/scallop.module';
import { CoinModule } from './protocols/coin/coin.module';

@Module({
  imports: [CetusModule, ScallopModule, CoinModule],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}
