import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContractsModule } from '../contracts/contracts.module';
import { VaultsModule } from '../vaults/vaults.module';

@Module({
  imports: [PrismaModule, ContractsModule, VaultsModule],
  providers: [IndexerService],
})
export class IndexerModule {}
