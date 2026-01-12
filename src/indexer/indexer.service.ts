import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { PrismaService } from '../prisma/prisma.service';
import { VaultTVLService } from '../vaults/vault-tvl.service';
import { Config, SuiConfig } from '../config/configuration';
import { CoreModuleEnum, VaultEventEnum } from '../contracts/contracts.config';

interface VaultCreatedEvent {
  id: string;
  owner: string;
  name: string;
  strategy_type: string;
  timestamp: string;
}

interface AssetDepositedEvent {
  vault_id: string;
  asset_type: string;
  asset_key: string;
  timestamp: string;
}

interface AssetWithdrawnEvent {
  vault_id: string;
  asset_key: string;
  timestamp: string;
}

interface VaultDestroyedEvent {
  id: string;
}

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private readonly suiClient: SuiClient;
  private readonly corePackageId: string;
  private isIndexing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<Config>,
    private readonly vaultTVLService: VaultTVLService,
  ) {
    const suiConfig = this.configService.get<SuiConfig>('sui');

    if (!suiConfig) {
      throw new Error('Sui configuration is missing');
    }

    this.suiClient = new SuiClient({
      url: getFullnodeUrl(suiConfig.network),
    });
    this.corePackageId = this.configService.get<string>('sui.corePackageId', {
      infer: true,
    })!;
  }

  async onModuleInit() {
    await this.prisma.indexerState.upsert({
      where: { id: 'main' },
      update: {},
      create: { id: 'main', lastCursor: null },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    if (this.isIndexing) {
      this.logger.debug('Already indexing, skipping...');
      return;
    }

    this.isIndexing = true;
    try {
      await this.indexEvents();
    } catch (error) {
      this.logger.error('Error indexing events:', error);
    } finally {
      this.isIndexing = false;
    }
  }

  private async indexEvents() {
    const state = await this.prisma.indexerState.findUnique({
      where: { id: 'main' },
    });

    const cursor = state?.lastCursor ? JSON.parse(state.lastCursor) : undefined;

    this.logger.debug(
      `Querying events with cursor: ${cursor ? JSON.stringify(cursor) : 'none'}`,
    );

    const events = await this.suiClient.queryEvents({
      query: {
        MoveModule: {
          package: this.corePackageId,
          module: CoreModuleEnum.VAULT,
        },
      },
      cursor,
      limit: 50,
      order: 'ascending',
    });

    if (events.data.length === 0) {
      this.logger.debug('No new events');
      return;
    }

    this.logger.log(`Processing ${events.data.length} events`);

    for (const event of events.data) {
      await this.processEvent(event);
    }

    if (events.nextCursor) {
      await this.prisma.indexerState.update({
        where: { id: 'main' },
        data: { lastCursor: JSON.stringify(events.nextCursor) },
      });
    }
  }

  private async processEvent(event: {
    type: string;
    parsedJson: unknown;
    timestampMs?: string | null;
  }) {
    const eventType = event.type.split('::').pop();
    const data = event.parsedJson;

    this.logger.log(`Processing event: ${eventType}`);

    switch (eventType) {
      case VaultEventEnum.VAULT_CREATED:
        await this.handleVaultCreated(data as VaultCreatedEvent);
        break;
      case VaultEventEnum.ASSET_DEPOSITED:
        await this.handleAssetDeposited(data as AssetDepositedEvent);
        break;
      case VaultEventEnum.ASSET_WITHDRAWN:
        await this.handleAssetWithdrawn(data as AssetWithdrawnEvent);
        break;
      case VaultEventEnum.VAULT_DESTROYED:
        await this.handleVaultDestroyed(data as VaultDestroyedEvent);
        break;
      default:
        this.logger.warn(`Unknown event type: ${eventType}`);
    }
  }

  private async handleVaultCreated(data: VaultCreatedEvent) {
    this.logger.log(`Creating vault: ${data.id}`);

    await this.prisma.vault.upsert({
      where: { id: data.id },
      update: {
        owner: data.owner,
        name: data.name,
        strategyType: data.strategy_type,
      },
      create: {
        id: data.id,
        owner: data.owner,
        name: data.name,
        strategyType: data.strategy_type,
        tvl: 0,
        apy: 0,
        isActive: true,
        createdAt: new Date(parseInt(data.timestamp)),
      },
    });

    await this.prisma.vaultHistory.create({
      data: {
        vaultId: data.id,
        tvl: 0,
        apy: 0,
        timestamp: new Date(parseInt(data.timestamp)),
      },
    });
  }

  private async handleAssetDeposited(data: AssetDepositedEvent) {
    this.logger.log(`Asset deposited to vault: ${data.vault_id}`);
    await this.vaultTVLService.recalculateVaultTVL(data.vault_id);
  }

  private async handleAssetWithdrawn(data: AssetWithdrawnEvent) {
    this.logger.log(`Asset withdrawn from vault: ${data.vault_id}`);
    await this.vaultTVLService.recalculateVaultTVL(data.vault_id);
  }

  private async handleVaultDestroyed(data: VaultDestroyedEvent) {
    this.logger.log(`Vault destroyed: ${data.id}`);

    await this.prisma.vault.update({
      where: { id: data.id },
      data: { isActive: false },
    });
  }
}
