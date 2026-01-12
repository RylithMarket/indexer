import { Module } from '@nestjs/common';
import { CoinStrategy } from './coin.strategy';
import { DefiLlamaModule } from 'src/defillama/defillama.module';

@Module({
  imports: [DefiLlamaModule],
  providers: [CoinStrategy],
  exports: [CoinStrategy],
})
export class CoinModule {}
