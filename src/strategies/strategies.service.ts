import { Injectable, Logger } from '@nestjs/common';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/configuration';
import {
  IValuableObject,
  PositionInfo,
} from './interfaces/defi-protocol.interface';
import { CetusPositionStrategy } from './protocols/cetus/strategies/position.strategy';
import { CoinStrategy } from './protocols/coin/coin.strategy';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);
  private readonly suiClient: SuiClient;
  private readonly strategies: (IValuableObject & { protocol: string })[];

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly cetusPositionStrategy: CetusPositionStrategy,
    private readonly coinStrategy: CoinStrategy,
  ) {
    const suiConfig = this.configService.get<Config['sui']>('sui');
    this.suiClient = new SuiClient({
      url: getFullnodeUrl(suiConfig?.network || 'testnet'),
    });

    this.strategies = [this.cetusPositionStrategy, this.coinStrategy];
  }

  findStrategy(type: string): (IValuableObject & { protocol: string }) | null {
    return this.strategies.find((s) => s.canHandle(type)) || null;
  }

  async calculateValue(id: string, type: string): Promise<number> {
    const strategy = this.findStrategy(type);
    if (!strategy) return 0;
    return strategy.calculatePrice(id);
  }

  async getVaultPositions(vaultId: string): Promise<PositionInfo[]> {
    const positions: PositionInfo[] = [];

    try {
      const dofs = await this.suiClient.getDynamicFields({ parentId: vaultId });

      for (const dof of dofs.data) {
        const obj = await this.suiClient.getObject({
          id: dof.objectId,
          options: { showType: true },
        });

        if (!obj.data?.type) continue;

        const type = obj.data.type;
        const strategy = this.findStrategy(type);

        if (strategy) {
          const valueUsd = await strategy.calculatePrice(dof.objectId);
          positions.push({
            objectId: dof.objectId,
            type,
            protocol: strategy.protocol,
            valueUsd,
          });
        } else {
          positions.push({
            objectId: dof.objectId,
            type,
            protocol: 'Unknown',
            valueUsd: 0,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error getting vault positions: ${error}`);
    }

    return positions;
  }

  async calculateTotalTVL(vaultId: string): Promise<number> {
    const positions = await this.getVaultPositions(vaultId);
    return positions.reduce((sum, p) => sum + p.valueUsd, 0);
  }
}
