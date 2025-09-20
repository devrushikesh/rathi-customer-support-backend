/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `device_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_userId_key" ON "public"."device_tokens"("userId");
