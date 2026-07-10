-- AlterTable
ALTER TABLE "User" ADD COLUMN     "catBudgets" JSONB NOT NULL DEFAULT '{}';

-- Normalize Transaction sign convention (in => positive, out => negative)
UPDATE "Transaction" SET "amount" = -ABS("amount") WHERE "type" = 'out';
UPDATE "Transaction" SET "amount" = ABS("amount") WHERE "type" = 'in';
