import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CetusClmmSDK } from '@cetusprotocol/sui-clmm-sdk';
import { CetusService } from './cetus.service';
import { DefiLlamaModule } from 'src/defillama/defillama.module';
import { CetusPositionStrategy } from './strategies/position.strategy';
import { Config } from 'src/config/configuration';

@Module({
  imports: [ConfigModule, DefiLlamaModule],
  providers: [
    CetusService,
    CetusPositionStrategy,
    {
      provide: CetusClmmSDK,
      useFactory: (configService: ConfigService<Config>) => {
        const network = configService.get('sui.network', { infer: true });
        const env = network === 'mainnet' ? 'mainnet' : 'testnet';
        return CetusClmmSDK.createSDK({ env });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CetusService, CetusPositionStrategy],
})
export class CetusModule {}
