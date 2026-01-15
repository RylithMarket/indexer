import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VaultsService } from './vaults.service';
import { VaultsController } from './vaults.controller';
import { VaultTVLService } from './vault-tvl.service';
import { VaultTVLProcessor } from './vaults.queue';
import { VaultTVLProducer } from './vault-tvl.producer';
import { PrismaModule } from '../prisma/prisma.module';
import { StrategiesModule } from '../strategies/strategies.module';

@Module({
  imports: [
    PrismaModule,
    StrategiesModule,
    BullModule.registerQueue({
      name: 'vault-tvl-sync',
    }),
  ],
  controllers: [VaultsController],
  providers: [
    VaultsService,
    VaultTVLService,
    VaultTVLProcessor,
    VaultTVLProducer,
  ],
  exports: [VaultTVLService, VaultsService, VaultTVLProducer],
})
export class VaultsModule {}
