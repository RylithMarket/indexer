import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { IndexerModule } from './indexer/indexer.module';
import { VaultsModule } from './vaults/vaults.module';
import { PrismaModule } from './prisma/prisma.module';
import { ContractsModule } from './contracts/contracts.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ContractsModule,
    IndexerModule,
    VaultsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
