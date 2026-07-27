-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "onlyAdminsCanEditInfo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onlyAdminsCanMessage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inviteCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_inviteCode_key" ON "Conversation"("inviteCode");
