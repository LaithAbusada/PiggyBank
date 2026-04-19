-- CreateTable
CREATE TABLE "Recurring" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "note" TEXT,
    "cat" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startYm" TEXT NOT NULL,
    "lastRunYm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recurring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recurring_userId_active_idx" ON "Recurring"("userId", "active");

-- AddForeignKey
ALTER TABLE "Recurring" ADD CONSTRAINT "Recurring_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
