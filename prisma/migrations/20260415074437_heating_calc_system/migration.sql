-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "calculationLineId" TEXT,
ADD COLUMN     "calculationRunId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "heatedArea" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "HeatingSetting" (
    "id" TEXT NOT NULL,
    "effectiveFromMonth" TEXT NOT NULL,
    "tariffPerUnit" DOUBLE PRECISION NOT NULL,
    "normPerSquareMeter" DOUBLE PRECISION NOT NULL,
    "seasonCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "commonAreaCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "lossCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeatingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatingCalculationRun" (
    "id" TEXT NOT NULL,
    "billingMonth" TEXT NOT NULL,
    "tariffPerUnit" DOUBLE PRECISION NOT NULL,
    "normPerSquareMeter" DOUBLE PRECISION NOT NULL,
    "seasonCoefficient" DOUBLE PRECISION NOT NULL,
    "commonAreaCoefficient" DOUBLE PRECISION NOT NULL,
    "lossCoefficient" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatingCalculationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatingCalculationLine" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meterId" TEXT,
    "billingMonth" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "previousReading" INTEGER,
    "currentReading" INTEGER,
    "rawConsumption" DOUBLE PRECISION NOT NULL,
    "finalConsumption" DOUBLE PRECISION NOT NULL,
    "normPerSquareMeter" DOUBLE PRECISION NOT NULL,
    "seasonCoefficient" DOUBLE PRECISION NOT NULL,
    "commonAreaCoefficient" DOUBLE PRECISION NOT NULL,
    "lossCoefficient" DOUBLE PRECISION NOT NULL,
    "tariffPerUnit" DOUBLE PRECISION NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatingCalculationLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeatingSetting_effectiveFromMonth_key" ON "HeatingSetting"("effectiveFromMonth");

-- CreateIndex
CREATE INDEX "HeatingCalculationLine_billingMonth_idx" ON "HeatingCalculationLine"("billingMonth");

-- CreateIndex
CREATE INDEX "HeatingCalculationLine_userId_idx" ON "HeatingCalculationLine"("userId");

-- CreateIndex
CREATE INDEX "HeatingCalculationLine_meterId_idx" ON "HeatingCalculationLine"("meterId");

-- CreateIndex
CREATE INDEX "Payment_billingMonth_idx" ON "Payment"("billingMonth");

-- CreateIndex
CREATE INDEX "Payment_calculationRunId_idx" ON "Payment"("calculationRunId");

-- CreateIndex
CREATE INDEX "Payment_calculationLineId_idx" ON "Payment"("calculationLineId");

-- AddForeignKey
ALTER TABLE "HeatingCalculationLine" ADD CONSTRAINT "HeatingCalculationLine_runId_fkey" FOREIGN KEY ("runId") REFERENCES "HeatingCalculationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatingCalculationLine" ADD CONSTRAINT "HeatingCalculationLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatingCalculationLine" ADD CONSTRAINT "HeatingCalculationLine_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
