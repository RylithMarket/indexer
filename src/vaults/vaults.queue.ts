import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StrategiesService } from '../strategies/strategies.service';
import { Logger } from '@nestjs/common';

export interface SyncVaultTVLJob {
  vaultId: string;
}

@Processor('vault-tvl-sync')
export class VaultTVLProcessor extends WorkerHost {
  private readonly logger = new Logger(VaultTVLProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategiesService: StrategiesService,
  ) {
    super();
  }

  async process(job: Job<SyncVaultTVLJob>): Promise<any> {
    const { vaultId } = job.data;

    const vault = await this.prisma.vault.findUnique({
      where: { id: vaultId },
    });

    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    const positions = await this.strategiesService.getVaultPositions(vaultId);
    const tvl = (positions as typeof positions).reduce(
      (sum, p) => sum + p.valueUsd,
      0,
    );

    await this.prisma.vault.update({
      where: { id: vaultId },
      data: { tvl, updatedAt: new Date() },
    });

    return { vaultId, tvl, success: true };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<SyncVaultTVLJob>, result: any) {
    this.logger.log(
      `[vault-tvl-sync] Completed job ${job.id} for vault ${job.data.vaultId}:`,
      result,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job, err: Error) {
    this.logger.error(
      `[vault-tvl-sync] Failed job ${job?.id} for vault ${job?.data.vaultId}:`,
      err.message,
    );
  }
}
