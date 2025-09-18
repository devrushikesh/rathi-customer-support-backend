/*
  Warnings:

  - You are about to drop the column `isAttachmentRequested` on the `issues` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."issues" DROP COLUMN "isAttachmentRequested";
