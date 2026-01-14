import { Injectable, Logger } from '@nestjs/common';
import { CetusClmmSDK } from '@cetusprotocol/sui-clmm-sdk';
import { TickMath, ClmmPoolUtil } from '@cetusprotocol/common-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { IValuableObject } from 'src/strategies/interfaces/defi-protocol.interface';
import { DefiLlamaService } from 'src/defillama';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/configuration';

@Injectable()
export class CetusPositionStrategy implements IValuableObject {
  readonly protocol = 'Cetus';
  private readonly logger = new Logger(CetusPositionStrategy.name);
  private readonly suiClient: SuiClient;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly cetusSdk: CetusClmmSDK,
    private readonly defiLlamaService: DefiLlamaService,
  ) {
    const suiConfig = this.configService.get<Config['sui']>('sui');
    if (!suiConfig) throw new Error('Sui configuration is missing');
    this.suiClient = new SuiClient({ url: getFullnodeUrl(suiConfig.network) });
  }

  canHandle(type: string): boolean {
    return type.includes('::position::Position');
  }

  async calculatePrice(id: string): Promise<number> {
    try {
      const obj = await this.suiClient.getObject({
        id,
        options: { showContent: true },
      });
      if (!obj.data?.content) return 0;

      const fields = (obj.data.content as any)?.fields as Record<string, any>;
      const liquidity = new BN(fields?.liquidity || 0) as BN;
      if (liquidity.isZero()) return 0;

      const pool = await this.cetusSdk.Pool.getPool(
        (fields?.pool || '') as string,
      );
      if (!pool) return 0;

      const tickLower = this.parseTick(
        fields.tick_lower || fields.tick_lower_index,
      );
      const tickUpper = this.parseTick(
        fields.tick_upper || fields.tick_upper_index,
      );

      const currentSqrtPrice = new BN(pool?.current_sqrt_price || 0) as BN;
      const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(tickLower) as BN;
      const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(tickUpper) as BN;

      const amounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
        liquidity,
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        false,
      );

      const totalA = (new BN(amounts?.coin_amount_a || 0) as BN).add(
        new BN((fields?.fee_owed_coin_a || 0) as string) as BN,
      ) as BN;
      const totalB = (new BN(amounts?.coin_amount_b || 0) as BN).add(
        new BN((fields?.fee_owed_coin_b || 0) as string) as BN,
      ) as BN;

      const [decimalsA, decimalsB] = await Promise.all([
        this.getCoinDecimals(pool.coin_type_a),
        this.getCoinDecimals(pool.coin_type_b),
      ]);

      const totalAStr = String((totalA as BN).toString());
      const totalBStr = String((totalB as BN).toString());
      const readableA = new Decimal(totalAStr).div(
        10 ** (decimalsA as number),
      ) as any as Decimal;
      const readableB = new Decimal(totalBStr).div(
        10 ** (decimalsB as number),
      ) as any as Decimal;

      const coinIdA = `sui:${pool.coin_type_a}`;
      const coinIdB = `sui:${pool.coin_type_b}`;
      const prices = await this.defiLlamaService.getCurrentPrices({
        coins: [coinIdA, coinIdB],
      });

      const priceA = prices?.coins[coinIdA]?.price || 0;
      const priceB = prices?.coins[coinIdB]?.price || 0;

      return readableA.mul(priceA).add(readableB.mul(priceB)).toNumber();
    } catch (error) {
      this.logger.error(`Error calculating position ${id}: ${error}`);
      return 0;
    }
  }

  private parseTick(tickData: any): number {
    if (!tickData?.fields?.bits) return 0;
    const bits = parseInt(tickData.fields.bits as string, 10);
    return bits > 0x7fffffff ? bits - 0x100000000 : bits;
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
