-- CreateEnum
CREATE TYPE "public"."CustomerRole" AS ENUM ('CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."EmployeeRole" AS ENUM ('ISSUE_MANAGER', 'HEAD', 'SERVICE_ENGINEER');

-- CreateEnum
CREATE TYPE "public"."CustomerStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InternalStatus" AS ENUM ('NEW', 'ASSIGNED', 'REASSIGNED', 'TRANSFERRED', 'WAITING_FOR_PARTS', 'WAITING_FOR_APPROVAL', 'ESCALATED', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('ISSUE_CREATED', 'ASSIGNED', 'REASSIGNED', 'TRANSFERRED', 'ESCALATED', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REQUESTED', 'SITE_VISIT_REQUESTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_COMPLETED', 'PRIORITY_CHANGED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('HARDWARE_ISSUE', 'QUALITY_ISSUE', 'MAINTENANCE', 'INSTALLATION', 'TRAINING', 'WARRANTY_CLAIM', 'SERVICING', 'ELECTRICAL_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Department" AS ENUM ('SALES', 'SERVICE', 'ENGINEERING', 'MANUFACTURING', 'FABRICATION', 'DESIGN', 'QUALITY');

-- CreateEnum
CREATE TYPE "public"."SiteVisitRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile_no" VARCHAR(20) NOT NULL,
    "role" "public"."CustomerRole" NOT NULL DEFAULT 'CUSTOMER',
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
    "department" "public"."Department",
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
    "description" TEXT NOT NULL,
    "machine" VARCHAR(100) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "category" "public"."Category" NOT NULL,
    "customerStatus" "public"."CustomerStatus" NOT NULL DEFAULT 'OPEN',
    "internalStatus" "public"."InternalStatus" NOT NULL DEFAULT 'NEW',
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
CREATE TABLE "public"."issue_assigned_departments" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isStartedWork" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "issue_assigned_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."issue_site_visits" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "public"."VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "notes" TEXT,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_visit_requests" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "status" "public"."SiteVisitRequestStatus" NOT NULL,
    "requestFromName" TEXT NOT NULL,
    "requestFromDepartment" "public"."Department" NOT NULL,
    "reason" TEXT,
    "urgency" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "requestFromHeadId" TEXT NOT NULL,
    "siteVisitId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_visit_requests_pkey" PRIMARY KEY ("id")
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
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "public"."customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_mobile_no_key" ON "public"."customers"("mobile_no");

-- CreateIndex
CREATE INDEX "customers_mobile_no_idx" ON "public"."customers"("mobile_no");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_mobile_no_key" ON "public"."employees"("mobile_no");

-- CreateIndex
CREATE INDEX "employees_mobile_no_idx" ON "public"."employees"("mobile_no");

-- CreateIndex
CREATE INDEX "employees_department_isActive_idx" ON "public"."employees"("department", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "issues_ticketNo_key" ON "public"."issues"("ticketNo");

-- CreateIndex
CREATE INDEX "issues_customerStatus_idx" ON "public"."issues"("customerStatus");

-- CreateIndex
CREATE INDEX "issues_internalStatus_category_idx" ON "public"."issues"("internalStatus", "category");

-- CreateIndex
CREATE INDEX "issues_customerId_createdAt_idx" ON "public"."issues"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "issues_ticketNo_idx" ON "public"."issues"("ticketNo");

-- CreateIndex
CREATE INDEX "issues_dueDate_idx" ON "public"."issues"("dueDate");

-- CreateIndex
CREATE INDEX "issue_assigned_departments_employeeId_isActive_idx" ON "public"."issue_assigned_departments"("employeeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "issue_assigned_departments_issueId_employeeId_isActive_key" ON "public"."issue_assigned_departments"("issueId", "employeeId", "isActive");

-- CreateIndex
CREATE INDEX "issue_site_visits_employeeId_scheduledDate_idx" ON "public"."issue_site_visits"("employeeId", "scheduledDate");

-- CreateIndex
CREATE INDEX "issue_site_visits_status_scheduledDate_idx" ON "public"."issue_site_visits"("status", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "site_visit_requests_siteVisitId_key" ON "public"."site_visit_requests"("siteVisitId");

-- CreateIndex
CREATE INDEX "site_visit_requests_status_urgency_idx" ON "public"."site_visit_requests"("status", "urgency");

-- CreateIndex
CREATE INDEX "site_visit_requests_requestFromDepartment_status_idx" ON "public"."site_visit_requests"("requestFromDepartment", "status");

-- CreateIndex
CREATE INDEX "issue_timeline_issueId_createdAt_idx" ON "public"."issue_timeline"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "issue_timeline_visibleToCustomer_idx" ON "public"."issue_timeline"("visibleToCustomer");

-- AddForeignKey
ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_assigned_departments" ADD CONSTRAINT "issue_assigned_departments_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_assigned_departments" ADD CONSTRAINT "issue_assigned_departments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_site_visits" ADD CONSTRAINT "issue_site_visits_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_site_visits" ADD CONSTRAINT "issue_site_visits_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_visit_requests" ADD CONSTRAINT "site_visit_requests_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_visit_requests" ADD CONSTRAINT "site_visit_requests_requestFromHeadId_fkey" FOREIGN KEY ("requestFromHeadId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_visit_requests" ADD CONSTRAINT "site_visit_requests_siteVisitId_fkey" FOREIGN KEY ("siteVisitId") REFERENCES "public"."issue_site_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."issue_timeline" ADD CONSTRAINT "issue_timeline_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
