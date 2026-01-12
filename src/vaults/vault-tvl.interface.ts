export interface IVaultTVLCalculator {
  recalculateVaultTVL(vaultId: string): Promise<void>;
}
