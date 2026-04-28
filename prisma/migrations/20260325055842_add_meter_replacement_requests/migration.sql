-- CreateTable
CREATE TABLE "MeterReplacementRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldMeterId" TEXT NOT NULL,
    "newTitle" TEXT NOT NULL,
    "newSerialNumber" TEXT NOT NULL,
    "newType" "MeterType" NOT NULL,
    "initialReading" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'CREATED',
    "adminComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "MeterReplacementRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MeterReplacementRequest" ADD CONSTRAINT "MeterReplacementRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReplacementRequest" ADD CONSTRAINT "MeterReplacementRequest_oldMeterId_fkey" FOREIGN KEY ("oldMeterId") REFERENCES "Meter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
