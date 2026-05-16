DO $$
BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Business"
ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPaymentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod";
