CREATE TABLE IF NOT EXISTS "ManualBlock" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ManualBlock_businessId_startsAt_endsAt_idx"
ON "ManualBlock"("businessId", "startsAt", "endsAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint constraint_row
        JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
        WHERE constraint_row.conname = 'ManualBlock_businessId_fkey'
          AND table_row.relname = 'ManualBlock'
    ) THEN
        ALTER TABLE "ManualBlock"
        ADD CONSTRAINT "ManualBlock_businessId_fkey"
        FOREIGN KEY ("businessId") REFERENCES "Business"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
