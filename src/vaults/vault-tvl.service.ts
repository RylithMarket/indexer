import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StrategiesService } from '../strategies/strategies.service';
import { IVaultTVLCalculator } from './vault-tvl.interface';

@Injectable()
export class VaultTVLService implements IVaultTVLCalculator {
  private readonly logger = new Logger(VaultTVLService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategiesService: StrategiesService,
  ) {}

  async recalculateVaultTVL(vaultId: string): Promise<void> {
    try {
      const tvl = (await this.strategiesService.calculateTotalTVL(
        vaultId,
      )) as number;

      await this.prisma.vault.update({
        where: { id: vaultId },
        data: { tvl },
      });

      await this.prisma.vaultHistory.create({
        data: {
          vaultId,
          tvl: tvl as number,
          apy: 0,
        },
      });

      this.logger.log(`Updated vault ${vaultId} TVL: ${tvl}`);
    } catch (error) {
      this.logger.error(`Error recalculating TVL for vault ${vaultId}:`, error);
    }
  }
}
