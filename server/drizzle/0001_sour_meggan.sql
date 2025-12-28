ALTER TABLE "Structure" ALTER COLUMN "buildingType" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."BuildingType";--> statement-breakpoint
CREATE TYPE "public"."BuildingType" AS ENUM('HOUSE', 'STORAGE', 'WORKSHOP', 'MARKETPLACE', 'TOWN_HALL');--> statement-breakpoint
ALTER TABLE "Structure" ALTER COLUMN "buildingType" SET DATA TYPE "public"."BuildingType" USING "buildingType"::"public"."BuildingType";--> statement-breakpoint
ALTER TABLE "Structure" ADD COLUMN "areaCost" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Structure" ADD COLUMN "unique" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Structure" ADD COLUMN "minTownHallLevel" integer DEFAULT 0 NOT NULL;