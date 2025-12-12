/*
  Warnings:

  - A unique constraint covering the columns `[dbName]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dbName` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "colorTheme" TEXT,
ADD COLUMN     "dbName" TEXT NOT NULL,
ADD COLUMN     "layoutType" TEXT,
ADD COLUMN     "style" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_dbName_key" ON "Store"("dbName");
