/*
  Warnings:

  - You are about to drop the column `settlementId` on the `Plot` table. All the data in the column will be lost.
  - You are about to drop the column `profileServerDataProfileId` on the `Settlement` table. All the data in the column will be lost.
  - You are about to drop the column `settlementId` on the `Tile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[plotId]` on the table `Settlement` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,serverId]` on the table `World` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `playerProfileId` to the `Settlement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plotId` to the `Settlement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Plot" DROP CONSTRAINT "Plot_settlementId_fkey";

-- DropForeignKey
ALTER TABLE "Settlement" DROP CONSTRAINT "Settlement_profileServerDataProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Tile" DROP CONSTRAINT "Tile_settlementId_fkey";

-- DropIndex
DROP INDEX "World_name_key";

-- AlterTable
ALTER TABLE "Plot" DROP COLUMN "settlementId";

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "xCoord" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "yCoord" INTEGER NOT NULL DEFAULT -1;

-- AlterTable
ALTER TABLE "Settlement" DROP COLUMN "profileServerDataProfileId",
ADD COLUMN     "playerProfileId" TEXT NOT NULL,
ADD COLUMN     "plotId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tile" DROP COLUMN "settlementId";

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_plotId_key" ON "Settlement"("plotId");

-- CreateIndex
CREATE UNIQUE INDEX "World_name_serverId_key" ON "World"("name", "serverId");

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "ProfileServerData"("profileId") ON DELETE RESTRICT ON UPDATE CASCADE;
