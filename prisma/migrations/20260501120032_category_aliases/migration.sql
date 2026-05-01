-- CreateTable
CREATE TABLE "CategoryAlias" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryAlias_userId_active_priority_idx" ON "CategoryAlias"("userId", "active", "priority");

-- AddForeignKey
ALTER TABLE "CategoryAlias" ADD CONSTRAINT "CategoryAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
