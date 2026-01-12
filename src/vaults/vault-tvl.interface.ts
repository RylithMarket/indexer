export interface IVaultTVLCalculator {
  recalculateVaultTVL(vaultId: string): Promise<void>;
  calculateTVLFromDOFs(vaultId: string): Promise<number>;
}
