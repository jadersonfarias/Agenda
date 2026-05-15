CREATE TYPE "BusinessPlan" AS ENUM ('FREE', 'BASIC', 'PRO');

CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

ALTER TABLE "Business"
ADD COLUMN "plan" "BusinessPlan" NOT NULL DEFAULT 'BASIC',
ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN "trialEndsAt" TIMESTAMP(3);

UPDATE "Business"
SET "trialEndsAt" = NOW() + INTERVAL '7 days'
WHERE "trialEndsAt" IS NULL;
