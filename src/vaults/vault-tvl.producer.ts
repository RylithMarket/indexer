import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SyncVaultTVLJob } from './vaults.queue';
import { VaultJobNames } from './vault-job.names';

@Injectable()
export class VaultTVLProducer {
  constructor(
    @InjectQueue('vault-tvl-sync') private queue: Queue<SyncVaultTVLJob>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueueSyncVaultTVL(vaultId: string) {
    await this.queue.add(
      VaultJobNames.SYNC_TVL,
      { vaultId },
      {
        jobId: `vault-${vaultId}`,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  async syncAllVaultsTVL() {
    const vaults = await this.prisma.vault.findMany({
      where: { isActive: true },
    });

    for (const vault of vaults) {
      await this.enqueueSyncVaultTVL(vault.id);
    }

    return { enqueued: vaults.length };
  }
}
