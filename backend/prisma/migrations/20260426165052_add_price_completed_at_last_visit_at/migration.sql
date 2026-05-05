-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "price" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Appointment_businessId_scheduledAt_endsAt_status_idx" ON "Appointment"("businessId", "scheduledAt", "endsAt", "status");

-- CreateIndex
CREATE INDEX "Appointment_businessId_serviceId_scheduledAt_idx" ON "Appointment"("businessId", "serviceId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_customerId_scheduledAt_idx" ON "Appointment"("customerId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");

-- CreateIndex
CREATE INDEX "Business_slug_timezone_idx" ON "Business"("slug", "timezone");

-- CreateIndex
CREATE INDEX "Service_businessId_name_idx" ON "Service"("businessId", "name");

-- CreateIndex
CREATE INDEX "Service_businessId_createdAt_idx" ON "Service"("businessId", "createdAt");
