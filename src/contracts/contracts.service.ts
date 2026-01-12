import { Injectable } from '@nestjs/common';
import {
  contractsConfig,
  ContractEventConfig,
  ContractModuleConfig,
  ContractPackageConfig,
  ContractsConfig,
  PackageEnum,
} from './contracts.config';

@Injectable()
export class ContractsService {
  private config: ContractsConfig;

  constructor() {
    this.config = contractsConfig;
  }

  /**
   * Get all contracts config
   */
  getConfig(): ContractsConfig {
    return this.config;
  }

  /**
   * Get specific package config
   */
  getPackage(packageName: PackageEnum): ContractPackageConfig {
    return this.config[packageName];
  }

  /**
   * Get all modules in a package
   */
  getModules(packageName: PackageEnum): Record<string, ContractModuleConfig> {
    return this.config[packageName].modules;
  }

  /**
   * Get specific module config
   */
  getModule(
    packageName: PackageEnum,
    moduleName: string,
  ): ContractModuleConfig | undefined {
    return this.config[packageName].modules[moduleName];
  }

  /**
   * Get all events in a module
   */
  getEvents(
    packageName: PackageEnum,
    moduleName: string,
  ): Record<string, ContractEventConfig> | undefined {
    const module = this.getModule(packageName, moduleName);
    return module?.events;
  }

  /**
   * Get specific event config
   */
  getEvent(
    packageName: PackageEnum,
    moduleName: string,
    eventName: string,
  ): ContractEventConfig | undefined {
    const events = this.getEvents(packageName, moduleName);
    return events?.[eventName];
  }

  /**
   * Check if event exists
   */
  eventExists(
    packageName: PackageEnum,
    moduleName: string,
    eventName: string,
  ): boolean {
    return !!this.getEvent(packageName, moduleName, eventName);
  }
}
