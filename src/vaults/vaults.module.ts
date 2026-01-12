import { Module } from '@nestjs/common';
import { VaultsService } from './vaults.service';
import { VaultsController } from './vaults.controller';
import { VaultTVLService } from './vault-tvl.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StrategiesModule } from '../strategies/strategies.module';

@Module({
  imports: [PrismaModule, StrategiesModule],
  controllers: [VaultsController],
  providers: [VaultsService, VaultTVLService],
  exports: [VaultTVLService],
})
export class VaultsModule {}
