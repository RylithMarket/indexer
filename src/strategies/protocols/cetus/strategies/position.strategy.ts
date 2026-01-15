import { Injectable, Logger } from '@nestjs/common';
import { CetusClmmSDK } from '@cetusprotocol/sui-clmm-sdk';
import { TickMath, ClmmPoolUtil } from '@cetusprotocol/common-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import Decimal from 'decimal.js';
import { IValuableObject } from 'src/strategies/interfaces/defi-protocol.interface';
import { DefiLlamaService } from 'src/defillama';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/configuration';
import BN from 'bn.js';

/**
 * Strategy to calculate the value of Cetus liquidity positions.
 *
 * TVL = Pricinpal Amounts + Accrued Fees
 */
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
      const pos = await this.cetusSdk.Position.getPositionById(id);

      if (!pos || !pos.liquidity || new BN(pos.liquidity).isZero()) return 0;

      const pool = await this.cetusSdk.Pool.getPool(pos.pool);
      if (!pool) return 0;

      const liquidity = new BN(pos.liquidity);
      const currentSqrtPrice = new BN(pool.current_sqrt_price);
      const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(
        pos.tick_lower_index,
      );
      const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(
        pos.tick_upper_index,
      );

      const principalAmounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
        liquidity,
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        false,
      );

      const feeGrowthGlobalA = new BN(pool.fee_growth_global_a);
      const feeGrowthGlobalB = new BN(pool.fee_growth_global_b);

      const feeGrowthInsideA = new BN(pos.fee_growth_inside_a);
      const feeGrowthInsideB = new BN(pos.fee_growth_inside_b);

      const feeOwedA = new BN(pos.fee_owned_a);
      const feeOwedB = new BN(pos.fee_owned_b);

      const pendingFeeA = feeGrowthGlobalA
        .sub(feeGrowthInsideA)
        .mul(liquidity)
        .shrn(64);
      const pendingFeeB = feeGrowthGlobalB
        .sub(feeGrowthInsideB)
        .mul(liquidity)
        .shrn(64);

      const totalAmountA = new BN(principalAmounts.coin_amount_a)
        .add(feeOwedA)
        .add(pendingFeeA);

      const totalAmountB = new BN(principalAmounts.coin_amount_b)
        .add(feeOwedB)
        .add(pendingFeeB);

      const [decimalsA, decimalsB] = await Promise.all([
        this.getCoinDecimals(pool.coin_type_a),
        this.getCoinDecimals(pool.coin_type_b),
      ]);

      const coinIdA = `sui:${pool.coin_type_a}`;
      const coinIdB = `sui:${pool.coin_type_b}`;

      const prices = await this.defiLlamaService.getCurrentPrices({
        coins: [coinIdA, coinIdB],
      });

      const priceA = prices?.coins[coinIdA]?.price || 0;
      const priceB = prices?.coins[coinIdB]?.price || 0;

      const valueA = new Decimal(totalAmountA.toString())
        .div(10 ** decimalsA)
        .mul(priceA);

      const valueB = new Decimal(totalAmountB.toString())
        .div(10 ** decimalsB)
        .mul(priceB);

      return valueA.add(valueB).toNumber();
    } catch (error) {
      this.logger.error(`Error calculating position ${id}: ${error}`);
      return 0;
    }
  }

  private async getCoinDecimals(coinType: string): Promise<number> {
    try {
      const metadata = await this.suiClient.getCoinMetadata({ coinType });
      return metadata?.decimals ?? 9;
    } catch {
      return 9;
    }
  }
}
