import {
  Injectable,
  NotFoundException,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StrategiesService } from '../strategies/strategies.service';
import { VaultTVLProducer } from './vault-tvl.producer';

export interface FindAllVaultsOptions {
  strategyType?: string;
  owner?: string;
  isActive?: boolean;
  sortBy?: 'tvl' | 'apy' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

@Injectable()
export class VaultsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(VaultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strategiesService: StrategiesService,
    private readonly tvlProducer: VaultTVLProducer,
  ) {}

  async onApplicationBootstrap() {
    const result = await this.tvlProducer.syncAllVaultsTVL();
    this.logger.log(`Enqueued ${result.enqueued} vaults for TVL sync`);
  }

  async findAll(options: FindAllVaultsOptions = {}) {
    const {
      strategyType,
      owner,
      isActive = true,
      sortBy = 'tvl',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = options;

    const where = {
      ...(strategyType && { strategyType }),
      ...(owner && { owner }),
      ...(isActive !== undefined && { isActive }),
    };

    const [vaults, total] = await Promise.all([
      this.prisma.vault.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      this.prisma.vault.count({ where }),
    ]);

    return {
      data: vaults,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + vaults.length < total,
      },
    };
  }

  async findOne(id: string) {
    const vault = await this.prisma.vault.findUnique({
      where: { id },
    });

    if (!vault) {
      throw new NotFoundException(`Vault with ID ${id} not found`);
    }

    const [history, positions] = await Promise.all([
      this.prisma.vaultHistory.findMany({
        where: { vaultId: id },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      this.strategiesService.getVaultPositions(id),
    ]);

    const calculatedTvl = (positions as typeof positions).reduce(
      (sum, p) => sum + p.valueUsd,
      0,
    );

    return {
      ...vault,
      tvl: calculatedTvl,
      history: (history as typeof history).reverse(),
      positions,
    };
  }

  async getVaultsByOwner(owner: string) {
    return this.findAll({ owner, isActive: undefined });
  }

  async getVaultStats() {
    const [totalVaults, activeVaults, totalTVLResult] = await Promise.all([
      this.prisma.vault.count(),
      this.prisma.vault.count({ where: { isActive: true } }),
      this.prisma.vault.aggregate({
        where: { isActive: true },
        _sum: { tvl: true },
      }),
    ]);

    return {
      totalVaults,
      activeVaults,
      totalTVL: totalTVLResult._sum.tvl || 0,
    };
  }

  async triggerVaultTVLSync(vaultId: string) {
    await this.tvlProducer.enqueueSyncVaultTVL(vaultId);
    return { vaultId, queued: true };
  }

  async syncAllVaultsTVL() {
    return this.tvlProducer.syncAllVaultsTVL();
  }
}
