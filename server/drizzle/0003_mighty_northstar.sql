CREATE TABLE "SettlementTransfer" (
	"id" text PRIMARY KEY NOT NULL,
	"fromSettlementId" text NOT NULL,
	"toSettlementId" text NOT NULL,
	"resourceType" text NOT NULL,
	"amountSent" integer NOT NULL,
	"amountReceived" integer NOT NULL,
	"lossPercentage" integer DEFAULT 0 NOT NULL,
	"distance" integer NOT NULL,
	"transportTime" integer NOT NULL,
	"status" text DEFAULT 'in_transit' NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ConstructionQueue" ADD COLUMN "tileId" text;--> statement-breakpoint
ALTER TABLE "ConstructionQueue" ADD COLUMN "slotPosition" integer;--> statement-breakpoint
ALTER TABLE "SettlementTransfer" ADD CONSTRAINT "SettlementTransfer_fromSettlementId_Settlement_id_fk" FOREIGN KEY ("fromSettlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SettlementTransfer" ADD CONSTRAINT "SettlementTransfer_toSettlementId_Settlement_id_fk" FOREIGN KEY ("toSettlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "settlement_transfers_from_idx" ON "SettlementTransfer" USING btree ("fromSettlementId");--> statement-breakpoint
CREATE INDEX "settlement_transfers_to_idx" ON "SettlementTransfer" USING btree ("toSettlementId");--> statement-breakpoint
CREATE INDEX "settlement_transfers_status_idx" ON "SettlementTransfer" USING btree ("status");--> statement-breakpoint
ALTER TABLE "ConstructionQueue" ADD CONSTRAINT "ConstructionQueue_tileId_Tile_id_fk" FOREIGN KEY ("tileId") REFERENCES "public"."Tile"("id") ON DELETE cascade ON UPDATE no action;