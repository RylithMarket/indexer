import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Config, DefiLlamaConfig } from '../config/configuration';
import {
  CurrentPriceResponse,
  HistoricalPriceResponse,
  BatchHistoricalPriceResponse,
  ChartResponse,
  PercentageChangeResponse,
  FirstPriceResponse,
  BlockResponse,
  GetCurrentPricesParams,
  GetHistoricalPriceParams,
  GetBatchHistoricalParams,
  GetChartParams,
  GetPercentageParams,
  GetFirstPriceParams,
  GetBlockParams,
} from './defillama.types';

@Injectable()
export class DefiLlamaService {
  private readonly logger = new Logger(DefiLlamaService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<Config>,
  ) {
    const defillamaConfig =
      this.configService.get<DefiLlamaConfig>('defiLlama');

    if (!defillamaConfig) {
      throw new Error('DefiLlama configuration is missing');
    }

    this.apiKey = defillamaConfig.apiKey;
    this.baseUrl = 'https://coins.llama.fi';
  }

  private formatCoins(coins: string[] | string): string {
    const coinArray = Array.isArray(coins) ? coins : [coins];
    return coinArray.map((coin) => this.mapCoinToCoingecko(coin)).join(',');
  }

  private mapCoinToCoingecko(coin: string): string {
    // If already in coingecko format, return as is
    if (coin.startsWith('coingecko:')) {
      return coin;
    }

    // Extract coin symbol from Sui coin type (e.g., 0x1::sui::SUI -> SUI)
    const parts = coin.split('::');
    if (parts.length === 3) {
      const symbol = parts[2];
      return `coingecko:${symbol}`;
    }

    // Default format
    return coin;
  }

  private buildParams(params: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    if (this.apiKey) {
      result['apikey'] = this.apiKey;
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        result[key] = String(value);
      }
    }
    return result;
  }

  private async request<T>(
    url: string,
    params?: Record<string, unknown>,
  ): Promise<T | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          params: this.buildParams(params || {}),
        }),
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          this.logger.warn('Rate limited, retrying after 1s...');
          await new Promise((r) => setTimeout(r, 1000));
          return this.request<T>(url, params);
        }
        if (error.response?.status === 404) {
          return null;
        }
        this.logger.error(`Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getCurrentPrices(
    params: GetCurrentPricesParams,
  ): Promise<CurrentPriceResponse | null> {
    const coins = this.formatCoins(params.coins);
    const url = `${this.baseUrl}/prices/current/${coins}`;
    return this.request<CurrentPriceResponse>(url, {
      searchWidth: params.searchWidth,
    });
  }

  async getHistoricalPrice(
    params: GetHistoricalPriceParams,
  ): Promise<HistoricalPriceResponse | null> {
    const coins = this.formatCoins(params.coins);
    const url = `${this.baseUrl}/prices/historical/${params.timestamp}/${coins}`;
    return this.request<HistoricalPriceResponse>(url, {
      searchWidth: params.searchWidth,
    });
  }

  async getBatchHistoricalPrices(
    params: GetBatchHistoricalParams,
  ): Promise<BatchHistoricalPriceResponse | null> {
    const coinsParam = JSON.stringify(params.coins);
    const url = `${this.baseUrl}/batchHistorical`;
    return this.request<BatchHistoricalPriceResponse>(url, {
      coins: coinsParam,
      searchWidth: params.searchWidth,
    });
  }

  async getTokenChart(params: GetChartParams): Promise<ChartResponse | null> {
    const coins = this.formatCoins(params.coins);
    const url = `${this.baseUrl}/chart/${coins}`;
    return this.request<ChartResponse>(url, {
      start: params.start,
      end: params.end,
      span: params.span,
      period: params.period,
    });
  }

  async getPercentageChange(
    params: GetPercentageParams,
  ): Promise<PercentageChangeResponse | null> {
    const coins = this.formatCoins(params.coins);
    const url = `${this.baseUrl}/percentage/${coins}`;
    return this.request<PercentageChangeResponse>(url, {
      timestamp: params.timestamp,
      lookForward: params.lookForward,
      period: params.period,
    });
  }

  async getFirstPrice(
    params: GetFirstPriceParams,
  ): Promise<FirstPriceResponse | null> {
    const coins = this.formatCoins(params.coins);
    const url = `${this.baseUrl}/prices/first/${coins}`;
    return this.request<FirstPriceResponse>(url);
  }

  async getClosestBlock(params: GetBlockParams): Promise<BlockResponse | null> {
    const url = `${this.baseUrl}/block/${params.chain}/${params.timestamp}`;
    return this.request<BlockResponse>(url);
  }
}
