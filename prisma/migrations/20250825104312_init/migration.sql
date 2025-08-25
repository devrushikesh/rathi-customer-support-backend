/*
  Warnings:

  - You are about to drop the `Issues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CUSTOMER', 'ISSUE_MANAGER', 'SERVICE_HEAD', 'ENGINEERING_HEAD', 'MANUFACTURING_HEAD');

-- CreateEnum
CREATE TYPE "public"."IssueStatus" AS ENUM ('Open', 'InProgress', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('StatusChange', 'Comment', 'PhotoRequested', 'Transferred');

-- DropTable
DROP TABLE "public"."Issues";

-- DropTable
DROP TABLE "public"."Users";

-- DropEnum
DROP TYPE "public"."Role";

-- DropEnum
DROP TYPE "public"."Status";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile_no" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Issue" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "status" "public"."IssueStatus" NOT NULL DEFAULT 'Open',
    "videos" TEXT[],
    "images" TEXT[],
    "assignedTo" INTEGER,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueHistory" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "actionType" "public"."ActionType" NOT NULL,
    "oldStatus" "public"."IssueStatus",
    "newStatus" "public"."IssueStatus",
    "fromUserId" INTEGER,
    "toUserId" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_no_key" ON "public"."User"("mobile_no");

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueHistory" ADD CONSTRAINT "IssueHistory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
