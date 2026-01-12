export interface PriceData {
  decimals: number;
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
}

export interface CurrentPriceResponse {
  coins: Record<string, PriceData>;
}

export interface HistoricalPriceResponse {
  coins: Record<string, PriceData>;
}

export interface BatchHistoricalPriceResponse {
  coins: Record<
    string,
    { prices: Array<{ timestamp: number; price: number; confidence?: number }> }
  >;
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  confidence?: number;
}

export interface ChartResponse {
  coins: Record<
    string,
    { decimals: number; symbol: string; prices: ChartDataPoint[] }
  >;
}

export interface PercentageChangeResponse {
  coins: Record<string, number>;
}

export interface FirstPriceResponse {
  coins: Record<string, { price: number; timestamp: number; symbol: string }>;
}

export interface BlockResponse {
  height: number;
  timestamp: number;
}

export interface GetCurrentPricesParams {
  coins: string[] | string;
  searchWidth?: string;
}

export interface GetHistoricalPriceParams {
  timestamp: number;
  coins: string[] | string;
  searchWidth?: string;
}

export interface GetBatchHistoricalParams {
  coins: Record<string, number[]>;
  searchWidth?: string;
}

export interface GetChartParams {
  coins: string[] | string;
  start?: number;
  end?: number;
  span?: number;
  period?: string;
}

export interface GetPercentageParams {
  coins: string[] | string;
  timestamp?: number;
  lookForward?: boolean;
  period?: string;
}

export interface GetFirstPriceParams {
  coins: string[] | string;
}

export interface GetBlockParams {
  chain: string;
  timestamp: number;
}
