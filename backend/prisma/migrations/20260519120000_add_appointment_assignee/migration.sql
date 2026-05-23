ALTER TABLE "Appointment" ADD COLUMN "assignedToUserId" TEXT;

CREATE INDEX "Appointment_businessId_assignedToUserId_scheduledAt_idx"
ON "Appointment"("businessId", "assignedToUserId", "scheduledAt");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_assignedToUserId_fkey"
FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
