/*
  Warnings:

  - The values [REJECTED] on the enum `FriendRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FriendRequestStatus_new" AS ENUM ('PENDING');
ALTER TABLE "public"."FriendRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "FriendRequest" ALTER COLUMN "status" TYPE "FriendRequestStatus_new" USING ("status"::text::"FriendRequestStatus_new");
ALTER TYPE "FriendRequestStatus" RENAME TO "FriendRequestStatus_old";
ALTER TYPE "FriendRequestStatus_new" RENAME TO "FriendRequestStatus";
DROP TYPE "public"."FriendRequestStatus_old";
ALTER TABLE "FriendRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
