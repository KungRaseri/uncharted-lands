ALTER TABLE "DisasterEvent" DROP CONSTRAINT "DisasterEvent_affectedRegionId_Region_id_fk";
--> statement-breakpoint
ALTER TABLE "DisasterEvent" ALTER COLUMN "affectedBiomes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "DisasterEvent" ADD COLUMN "affectedRegionIds" json NOT NULL;--> statement-breakpoint
ALTER TABLE "DisasterEvent" DROP COLUMN "affectedRegionId";