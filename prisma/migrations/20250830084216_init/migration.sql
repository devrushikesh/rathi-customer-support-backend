-- CreateEnum
CREATE TYPE "public"."EmployeeRole" AS ENUM ('ISSUE_MANAGER', 'ENGINEERING_HEAD', 'MANUFACTURING_HEAD', 'FABRICATION_HEAD', 'DESIGN_HEAD', 'SALES_HEAD', 'QUALITY_HEAD', 'SERVICE_HEAD', 'SERVICE_ENGINEERS');

-- CreateEnum
CREATE TYPE "public"."CustomerStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InternalStatus" AS ENUM ('OPEN', 'ASSIGNED', 'REASSIGNED', 'TRANSFERRED', 'WAITING_FOR_PARTS', 'ESCALATED', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('ISSUE_CREATED', 'ASSIGNED', 'REASSIGNED', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED', 'COMMENT_ADDED', 'SITE_VISIT_REQUEST', 'SITE_VISIT_CONFIRM', 'SITE_VISIT_COMPLETED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('HARDWARE_ISSUE', 'QUALITY_ISSUE', 'SOFTWARE_ISSUE', 'MAINTENANCE', 'INSTALLATION', 'TRAINING', 'WARRANTY_CLAIM', 'SERVICING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VisitStatus" AS ENUM ('PENDING', 'VISITED');

-- CreateEnum
CREATE TYPE "public"."Department" AS ENUM ('SALES', 'SERVICE', 'ENGINEERING', 'MANUFACTURING');

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
CREATE TABLE "public"."Employee" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "mobile_no" VARCHAR(20) NOT NULL,
    "department" "public"."Department" NOT NULL,
    "role" "public"."EmployeeRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."issues" (
    "id" TEXT NOT NULL,
    "ticketNo" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "machine" VARCHAR(100),
    "location" VARCHAR(100),
    "attachments_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "category" "public"."Category" NOT NULL,
    "customerStatus" "public"."CustomerStatus" NOT NULL DEFAULT 'OPEN',
    "internalStatus" "public"."InternalStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" INTEGER NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueAssinedDepartment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "employeeid" TEXT NOT NULL,

    CONSTRAINT "IssueAssinedDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IssueSiteVisit" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "public"."VisitStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "IssueSiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."issue_timeline" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "action" "public"."ActionType" NOT NULL DEFAULT 'ISSUE_CREATED',
    "comment" TEXT,
    "fromCustomerStatus" "public"."CustomerStatus",
    "toCustomerStatus" "public"."CustomerStatus",
    "fromInternalStatus" "public"."InternalStatus",
    "toInternalStatus" "public"."InternalStatus",
    "fromEmployeeId" TEXT,
    "toEmployeeId" TEXT,
    "visibleToCustomer" BOOLEAN NOT NULL DEFAULT false,
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
CREATE UNIQUE INDEX "Employee_email_key" ON "public"."Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_mobile_no_key" ON "public"."Employee"("mobile_no");

-- CreateIndex
CREATE UNIQUE INDEX "issues_ticketNo_key" ON "public"."issues"("ticketNo");

-- CreateIndex
CREATE INDEX "issues_customerStatus_idx" ON "public"."issues"("customerStatus");

-- CreateIndex
CREATE INDEX "issues_internalStatus_idx" ON "public"."issues"("internalStatus");

-- CreateIndex
CREATE INDEX "issues_customerId_idx" ON "public"."issues"("customerId");

-- CreateIndex
CREATE INDEX "issues_ticketNo_idx" ON "public"."issues"("ticketNo");

-- CreateIndex
CREATE INDEX "issue_timeline_issueId_idx" ON "public"."issue_timeline"("issueId");

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueAssinedDepartment" ADD CONSTRAINT "IssueAssinedDepartment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueAssinedDepartment" ADD CONSTRAINT "IssueAssinedDepartment_employeeid_fkey" FOREIGN KEY ("employeeid") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueSiteVisit" ADD CONSTRAINT "IssueSiteVisit_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IssueSiteVisit" ADD CONSTRAINT "IssueSiteVisit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_timeline" ADD CONSTRAINT "issue_timeline_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
