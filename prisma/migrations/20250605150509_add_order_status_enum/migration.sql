/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[type]` on the table `Printer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number,areaId]` on the table `Table` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED');

-- DropIndex
DROP INDEX "Table_number_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isPrinted" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "Printer" ADD COLUMN     "usbPort" TEXT,
ALTER COLUMN "ipAddress" DROP NOT NULL,
ALTER COLUMN "port" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Printer_type_key" ON "Printer"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Table_number_areaId_key" ON "Table"("number", "areaId");
