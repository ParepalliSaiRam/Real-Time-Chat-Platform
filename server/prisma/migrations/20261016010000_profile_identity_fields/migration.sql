-- Keep legacy accounts valid until they add a phone number in their profile.
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "phone" DROP DEFAULT;
UPDATE "User" SET "phone" = NULL WHERE "phone" = '';

-- Phone numbers must be unique while email remains the unique sign-in identifier.
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
