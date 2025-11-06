-- CreateIndex
CREATE INDEX "Plot_tileId_idx" ON "Plot"("tileId");

-- CreateIndex
CREATE INDEX "Region_worldId_xCoord_yCoord_idx" ON "Region"("worldId", "xCoord", "yCoord");

-- CreateIndex
CREATE INDEX "Region_xCoord_yCoord_idx" ON "Region"("xCoord", "yCoord");

-- CreateIndex
CREATE INDEX "Settlement_playerProfileId_idx" ON "Settlement"("playerProfileId");

-- CreateIndex
CREATE INDEX "Settlement_plotId_idx" ON "Settlement"("plotId");

-- CreateIndex
CREATE INDEX "Tile_regionId_idx" ON "Tile"("regionId");

-- CreateIndex
CREATE INDEX "Tile_biomeId_idx" ON "Tile"("biomeId");

-- CreateIndex
CREATE INDEX "Tile_type_idx" ON "Tile"("type");
