CREATE TYPE "public"."SettlementType" AS ENUM('OUTPOST', 'VILLAGE', 'TOWN', 'CITY');--> statement-breakpoint
ALTER TABLE "Settlement" ADD COLUMN "settlementType" "SettlementType" DEFAULT 'OUTPOST' NOT NULL;--> statement-breakpoint
ALTER TABLE "Settlement" ADD COLUMN "tier" integer DEFAULT 1 NOT NULL;