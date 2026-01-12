export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface DatabaseConfig {
  databaseUrl: string;
  directUrl: string;
}

export interface SuiConfig {
  corePackageId: string;
  marketplacePackageId: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  sui: SuiConfig;
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
    corePackageId: process.env.CORE_PACKAGE_ID || '',
    marketplacePackageId: process.env.MARKETPLACE_PACKAGE_ID || '',
  },
});
