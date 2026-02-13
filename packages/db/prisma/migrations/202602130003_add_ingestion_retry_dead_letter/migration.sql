ALTER TABLE "IngestionQueueJob" ADD COLUMN "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "IngestionQueueJob" ADD COLUMN "deadLetteredAt" DATETIME;

CREATE INDEX "IngestionQueueJob_status_nextAttemptAt_idx" ON "IngestionQueueJob"("status", "nextAttemptAt");
