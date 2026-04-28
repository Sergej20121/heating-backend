-- AddForeignKey
ALTER TABLE "SealRequest" ADD CONSTRAINT "SealRequest_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
