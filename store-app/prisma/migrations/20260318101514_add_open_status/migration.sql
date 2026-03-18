-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "appPhase" TEXT NOT NULL DEFAULT 'pre_open';

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "canMoveToPostOpenApp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "externalCustomerUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "openStatus" TEXT NOT NULL DEFAULT '準備前',
ADD COLUMN     "openedAt" TIMESTAMP(3),
ADD COLUMN     "staffReadiness" TEXT NOT NULL DEFAULT '未定';

-- CreateTable
CREATE TABLE "ConsultationMessage" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConsultationMessage" ADD CONSTRAINT "ConsultationMessage_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
