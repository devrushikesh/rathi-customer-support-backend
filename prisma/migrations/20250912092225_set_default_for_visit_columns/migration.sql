/*
  Warnings:

  - Made the column `completedVisits` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pendingVisits` on table `employees` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."employees" ALTER COLUMN "completedVisits" SET NOT NULL,
ALTER COLUMN "completedVisits" SET DEFAULT 0,
ALTER COLUMN "pendingVisits" SET NOT NULL,
ALTER COLUMN "pendingVisits" SET DEFAULT 0;
