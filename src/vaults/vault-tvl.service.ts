import { Injectable, Logger } from '@nestjs/common';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { PrismaService } from '../prisma/prisma.service';
import { IVaultTVLCalculator } from './vault-tvl.interface';

@Injectable()
export class VaultTVLService implements IVaultTVLCalculator {
  private readonly logger = new Logger(VaultTVLService.name);
  private readonly suiClient: SuiClient;

  constructor(private readonly prisma: PrismaService) {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
  }

  async recalculateVaultTVL(vaultId: string): Promise<void> {
    try {
      const vaultObject = await this.suiClient.getObject({
        id: vaultId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!vaultObject.data) {
        this.logger.warn(`Vault ${vaultId} not found on chain`);
        return;
      }

      const tvl = await this.calculateTVLFromDOFs(vaultId);

      await this.prisma.vault.update({
        where: { id: vaultId },
        data: { tvl },
      });

      await this.prisma.vaultHistory.create({
        data: {
          vaultId,
          tvl,
          apy: 0,
        },
      });

      this.logger.log(`Updated vault ${vaultId} TVL: ${tvl}`);
    } catch (error) {
      this.logger.error(`Error recalculating TVL for vault ${vaultId}:`, error);
    }
  }

  async calculateTVLFromDOFs(vaultId: string): Promise<number> {
    const dofs = await this.suiClient.getDynamicFields({
      parentId: vaultId,
    });

    let totalTVL = 0;

    for (const dof of dofs.data) {
      try {
        await this.suiClient.getObject({
          id: dof.objectId,
          options: { showContent: true },
        });

        totalTVL += 100;
      } catch (error) {
        this.logger.error(`Error fetching DOF ${dof.objectId}:`, error);
      }
    }

    return totalTVL;
  }
}
