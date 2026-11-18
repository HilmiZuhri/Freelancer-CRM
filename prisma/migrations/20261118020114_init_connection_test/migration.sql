-- CreateTable
CREATE TABLE "SystemCheck" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT 'Database connected successfully',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemCheck_pkey" PRIMARY KEY ("id")
);
