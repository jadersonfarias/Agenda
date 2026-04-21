-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "lastVisitAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Appointment"
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "price" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "Appointment"
SET "price" = "Service"."price"
FROM "Service"
WHERE "Appointment"."serviceId" = "Service"."id";

UPDATE "Appointment"
SET "completedAt" = "scheduledAt"
WHERE "status" = 'COMPLETED' AND "completedAt" IS NULL;

UPDATE "Customer"
SET "lastVisitAt" = "summary"."lastVisitAt"
FROM (
    SELECT "customerId", MAX("scheduledAt") AS "lastVisitAt"
    FROM "Appointment"
    WHERE "status" = 'COMPLETED'
    GROUP BY "customerId"
) AS "summary"
WHERE "Customer"."id" = "summary"."customerId";
