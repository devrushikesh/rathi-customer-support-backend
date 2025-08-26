-- CreateEnum
CREATE TYPE "public"."EmployeeRole" AS ENUM ('ISSUE_MANAGER', 'SERVICE_HEAD', 'ENGINEERING_HEAD', 'MANUFACTURING_HEAD');

-- CreateEnum
CREATE TYPE "public"."IssueStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('ISSUE_CREATED', 'ASSIGNED', 'REASSIGNED', 'COMMENT_ADDED', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('HARDWARE_ISSUE', 'SOFTWARE_ISSUE', 'MAINTENANCE', 'INSTALLATION', 'TRAINING', 'WARRANTY_CLAIM', 'OTHER');

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile_no" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile_no" VARCHAR(20) NOT NULL,
    "role" "public"."EmployeeRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."issues" (
    "id" TEXT NOT NULL,
    "ticketNo" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "machine" VARCHAR(100),
    "location" VARCHAR(100),
    "customerId" INTEGER NOT NULL,
    "assignedToId" TEXT,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "category" "public"."Category" NOT NULL,
    "status" "public"."IssueStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."issue_timeline" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "action" "public"."ActionType" NOT NULL DEFAULT 'ISSUE_CREATED',
    "comment" TEXT,
    "fromStatus" "public"."IssueStatus",
    "toStatus" "public"."IssueStatus",
    "fromEmployeeId" TEXT,
    "toEmployeeId" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "public"."customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_mobile_no_key" ON "public"."customers"("mobile_no");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "public"."customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_mobile_no_key" ON "public"."employees"("mobile_no");

-- CreateIndex
CREATE INDEX "employees_isActive_idx" ON "public"."employees"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "issues_ticketNo_key" ON "public"."issues"("ticketNo");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "public"."issues"("status");

-- CreateIndex
CREATE INDEX "issues_assignedToId_idx" ON "public"."issues"("assignedToId");

-- CreateIndex
CREATE INDEX "issues_customerId_idx" ON "public"."issues"("customerId");

-- CreateIndex
CREATE INDEX "issues_ticketNo_idx" ON "public"."issues"("ticketNo");

-- CreateIndex
CREATE INDEX "issue_timeline_issueId_idx" ON "public"."issue_timeline"("issueId");

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_timeline" ADD CONSTRAINT "issue_timeline_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_timeline" ADD CONSTRAINT "issue_timeline_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
