/*
  Warnings:

  - A unique constraint covering the columns `[userId,smsHash]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "smsHash" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apiToken" TEXT;

-- CreateTable
CREATE TABLE "ParseRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "senderPattern" TEXT,
    "contentPattern" TEXT,
    "amountRegex" TEXT NOT NULL,
    "merchantRegex" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "defaultCategory" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingSms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "smsHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingSms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParseRule_userId_active_priority_idx" ON "ParseRule"("userId", "active", "priority");

-- CreateIndex
CREATE INDEX "PendingSms_userId_createdAt_idx" ON "PendingSms"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSms_userId_smsHash_key" ON "PendingSms"("userId", "smsHash");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_smsHash_key" ON "Transaction"("userId", "smsHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_apiToken_key" ON "User"("apiToken");

-- AddForeignKey
ALTER TABLE "ParseRule" ADD CONSTRAINT "ParseRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingSms" ADD CONSTRAINT "PendingSms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
