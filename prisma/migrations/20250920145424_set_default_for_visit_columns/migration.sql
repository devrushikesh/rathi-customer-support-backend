/*
  Warnings:

  - You are about to drop the `DeviceToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DeviceToken" DROP CONSTRAINT "DeviceToken_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DeviceToken" DROP CONSTRAINT "DeviceToken_employeeId_fkey";

-- DropTable
DROP TABLE "public"."DeviceToken";

-- CreateTable
CREATE TABLE "public"."device_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "public"."device_tokens"("token");
