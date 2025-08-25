-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CUSTOMER', 'ISSUE_MANAGER', 'SERVICE_HEAD', 'ENGINEERING_HEAD', 'MANUFACTURING_HEAD');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."Users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile_no" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Issues" (
    "id" SERIAL NOT NULL,
    "machine" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo_url" TEXT,
    "video_url" TEXT,
    "audio_url" TEXT,
    "status" "public"."Status" NOT NULL,
    "is_forwarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_mobile_no_key" ON "public"."Users"("mobile_no");
