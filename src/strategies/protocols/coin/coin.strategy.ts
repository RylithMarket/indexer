import { Injectable, Logger } from '@nestjs/common';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import Decimal from 'decimal.js';
import { IValuableObject } from 'src/strategies/interfaces/defi-protocol.interface';
import { DefiLlamaService } from 'src/defillama';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/configuration';

@Injectable()
export class CoinStrategy implements IValuableObject {
  readonly protocol = 'Native Coin';
  private readonly logger = new Logger(CoinStrategy.name);
  private readonly suiClient: SuiClient;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly defiLlamaService: DefiLlamaService,
  ) {
    const suiConfig = this.configService.get<Config['sui']>('sui');
    this.suiClient = new SuiClient({
      url: getFullnodeUrl(suiConfig?.network || 'testnet'),
    });
  }

  canHandle(type: string): boolean {
    return type.includes('::coin::Coin<');
  }

  async calculatePrice(id: string): Promise<number> {
    try {
      const obj = await this.suiClient.getObject({
        id,
        options: { showContent: true, showType: true },
      });

      if (!obj.data?.content) return 0;

      const content = obj.data.content as any;
      const amount = content?.fields?.balance || 0;

      if (amount === 0) return 0;

      const type = obj.data?.type || '';
      const coinTypeMatch = type.match(/Coin<([^>]+)>/);
      if (!coinTypeMatch) return 0;

      const coinType = coinTypeMatch[1];
      const decimals = await this.getCoinDecimals(coinType);
      const readableAmount = new Decimal(amount.toString()).div(
        10 ** decimals,
      ) as any as Decimal;

      const coinIds = [
        `sui:${coinType}`,
        `coingecko:${coinType.split('::')[2].toLowerCase()}`,
      ];
      const prices = await this.defiLlamaService.getCurrentPrices({
        coins: coinIds,
      });

      this.logger.debug('Fetched prices', prices);
      if (!prices?.coins) return 0;

      let price = 0;
      for (const coinId of coinIds) {
        if (prices.coins[coinId]?.price) {
          price = prices.coins[coinId].price;
          break;
        }
      }
      this.logger.log(
        `Coin price [${id}]: ${price}, amount: ${readableAmount.toNumber()}`,
      );
      return readableAmount.mul(price).toNumber();
    } catch (error) {
      this.logger.error(`Error calculating coin price for ${id}: ${error}`);
      return 0;
    }
  }

  private async getCoinDecimals(coinType: string): Promise<number> {
    try {
      return (
        (await this.suiClient.getCoinMetadata({ coinType }))?.decimals || 9
      );
    } catch {
      return 9;
    }
  }
}
