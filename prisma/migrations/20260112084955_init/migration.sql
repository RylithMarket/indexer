-- CreateTable
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strategyType" TEXT NOT NULL,
    "imgUrl" TEXT,
    "tvl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "apy" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultHistory" (
    "id" SERIAL NOT NULL,
    "vaultId" TEXT NOT NULL,
    "tvl" DECIMAL(65,30) NOT NULL,
    "apy" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaultHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "lastCursor" TEXT,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vault_owner_idx" ON "Vault"("owner");

-- CreateIndex
CREATE INDEX "Vault_strategyType_idx" ON "Vault"("strategyType");

-- CreateIndex
CREATE INDEX "Vault_isActive_idx" ON "Vault"("isActive");

-- CreateIndex
CREATE INDEX "VaultHistory_vaultId_timestamp_idx" ON "VaultHistory"("vaultId", "timestamp");

-- AddForeignKey
ALTER TABLE "VaultHistory" ADD CONSTRAINT "VaultHistory_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE CASCADE ON UPDATE CASCADE;
