export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface DatabaseConfig {
  databaseUrl: string;
  directUrl: string;
}

export interface SuiConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  corePackageId: string;
  marketplacePackageId: string;
}

export interface DefiLlamaConfig {
  apiUrl: string;
  apiKey: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  sui: SuiConfig;
  defiLlama: DefiLlamaConfig;
}

export default (): Config => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    databaseUrl: process.env.DATABASE_URL || '',
    directUrl: process.env.DIRECT_URL || '',
  },
  sui: {
    network: process.env.NETWORK as 'mainnet' | 'testnet' | 'devnet',
    corePackageId: process.env.CORE_PACKAGE_ID || '',
    marketplacePackageId: process.env.MARKETPLACE_PACKAGE_ID || '',
  },
  defiLlama: {
    apiUrl: process.env.DEFILLAMA_API_URL || 'https://coins.llama.fi',
    apiKey: process.env.DEFILLAMA_API_KEY || '',
  },
});
