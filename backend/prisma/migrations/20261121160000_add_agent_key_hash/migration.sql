ALTER TABLE "Server"
ADD COLUMN "agentKeyHash" TEXT;

CREATE UNIQUE INDEX "Server_agentKeyHash_key"
ON "Server"("agentKeyHash");
