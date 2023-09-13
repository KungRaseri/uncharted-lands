/*
  Warnings:

  - A unique constraint covering the columns `[resourcesId]` on the table `Settlement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resourcesId` to the `Settlement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Settlement" ADD COLUMN     "resourcesId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Resources" (
    "id" TEXT NOT NULL,
    "water" INTEGER NOT NULL DEFAULT 5,
    "food" INTEGER NOT NULL DEFAULT 5,
    "wood" INTEGER NOT NULL DEFAULT 10,
    "stone" INTEGER NOT NULL DEFAULT 0,
    "ore" INTEGER NOT NULL DEFAULT 0,
    "settlementId" TEXT NOT NULL,

    CONSTRAINT "Resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resources_settlementId_key" ON "Resources"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_resourcesId_key" ON "Settlement"("resourcesId");

-- AddForeignKey
ALTER TABLE "Resources" ADD CONSTRAINT "Resources_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
