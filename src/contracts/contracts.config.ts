export enum PackageEnum {
  CORE = 'core',
  MARKETPLACE = 'marketplace',
}

export enum CoreModuleEnum {
  VAULT = 'vault',
}

export enum VaultEventEnum {
  VAULT_CREATED = 'VaultCreated',
  ASSET_DEPOSITED = 'AssetDeposited',
  ASSET_WITHDRAWN = 'AssetWithdrawn',
  VAULT_DESTROYED = 'VaultDestroyed',
}

export enum MarketplaceModuleEnum {
  // Add marketplace modules here
}

export interface ContractEventConfig {
  name: string;
  type: string;
}

export interface ContractModuleConfig {
  name: string;
  events: Record<string, ContractEventConfig>;
}

export interface ContractPackageConfig {
  name: string;
  modules: Record<string, ContractModuleConfig>;
}

export interface ContractsConfig {
  [PackageEnum.CORE]: ContractPackageConfig;
  [PackageEnum.MARKETPLACE]: ContractPackageConfig;
}

export const contractsConfig: ContractsConfig = {
  [PackageEnum.CORE]: {
    name: 'Core',
    modules: {
      [CoreModuleEnum.VAULT]: {
        name: CoreModuleEnum.VAULT,
        events: {
          [VaultEventEnum.VAULT_CREATED]: {
            name: VaultEventEnum.VAULT_CREATED,
            type: VaultEventEnum.VAULT_CREATED,
          },
          [VaultEventEnum.ASSET_DEPOSITED]: {
            name: VaultEventEnum.ASSET_DEPOSITED,
            type: VaultEventEnum.ASSET_DEPOSITED,
          },
          [VaultEventEnum.ASSET_WITHDRAWN]: {
            name: VaultEventEnum.ASSET_WITHDRAWN,
            type: VaultEventEnum.ASSET_WITHDRAWN,
          },
          [VaultEventEnum.VAULT_DESTROYED]: {
            name: VaultEventEnum.VAULT_DESTROYED,
            type: VaultEventEnum.VAULT_DESTROYED,
          },
        },
      },
    },
  },
  [PackageEnum.MARKETPLACE]: {
    name: 'Marketplace',
    modules: {},
  },
};
