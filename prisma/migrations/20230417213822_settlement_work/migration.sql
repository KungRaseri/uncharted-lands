/*
  Warnings:

  - You are about to drop the column `resourceId` on the `StructureModifier` table. All the data in the column will be lost.
  - You are about to drop the `PlotResource` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `area` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `food` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ore` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solar` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stone` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `water` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wind` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wood` to the `Plot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Resource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `Resource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `areaRequirement` to the `SettlementStructure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `populationRequirement` to the `SettlementStructure` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Plot" DROP CONSTRAINT "Plot_tileId_fkey";

-- DropForeignKey
ALTER TABLE "PlotResource" DROP CONSTRAINT "PlotResource_plotId_fkey";

-- DropForeignKey
ALTER TABLE "PlotResource" DROP CONSTRAINT "PlotResource_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "Region" DROP CONSTRAINT "Region_worldId_fkey";

-- DropForeignKey
ALTER TABLE "Settlement" DROP CONSTRAINT "Settlement_playerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Settlement" DROP CONSTRAINT "Settlement_plotId_fkey";

-- DropForeignKey
ALTER TABLE "SettlementStructure" DROP CONSTRAINT "SettlementStructure_settlementId_fkey";

-- DropForeignKey
ALTER TABLE "StructureModifier" DROP CONSTRAINT "StructureModifier_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "StructureModifier" DROP CONSTRAINT "StructureModifier_settlementStructureId_fkey";

-- DropForeignKey
ALTER TABLE "Tile" DROP CONSTRAINT "Tile_regionId_fkey";

-- DropForeignKey
ALTER TABLE "World" DROP CONSTRAINT "World_serverId_fkey";

-- AlterTable
ALTER TABLE "Plot" ADD COLUMN     "area" INTEGER NOT NULL,
ADD COLUMN     "food" INTEGER NOT NULL,
ADD COLUMN     "ore" INTEGER NOT NULL,
ADD COLUMN     "solar" INTEGER NOT NULL,
ADD COLUMN     "stone" INTEGER NOT NULL,
ADD COLUMN     "water" INTEGER NOT NULL,
ADD COLUMN     "wind" INTEGER NOT NULL,
ADD COLUMN     "wood" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "icon" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SettlementStructure" ADD COLUMN     "areaRequirement" INTEGER NOT NULL,
ADD COLUMN     "populationRequirement" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StructureModifier" DROP COLUMN "resourceId";

-- DropTable
DROP TABLE "PlotResource";

-- CreateTable
CREATE TABLE "SettlementResource" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SettlementResource_settlementId_resourceId_key" ON "SettlementResource"("settlementId", "resourceId");

-- AddForeignKey
ALTER TABLE "World" ADD CONSTRAINT "World_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "Tile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "ProfileServerData"("profileId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementResource" ADD CONSTRAINT "SettlementResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementResource" ADD CONSTRAINT "SettlementResource_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementStructure" ADD CONSTRAINT "SettlementStructure_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureModifier" ADD CONSTRAINT "StructureModifier_settlementStructureId_fkey" FOREIGN KEY ("settlementStructureId") REFERENCES "SettlementStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
