CREATE TABLE "SettlementModifier" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementId" text NOT NULL,
	"modifierType" text NOT NULL,
	"totalValue" numeric(10, 2) NOT NULL,
	"sourceCount" integer DEFAULT 0 NOT NULL,
	"contributingStructures" json DEFAULT '[]'::json,
	"lastCalculatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SettlementModifier_settlementId_modifierType_unique" UNIQUE("settlementId","modifierType")
);
--> statement-breakpoint
ALTER TABLE "SettlementModifier" ADD CONSTRAINT "SettlementModifier_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "SettlementModifier_settlementId_idx" ON "SettlementModifier" USING btree ("settlementId");--> statement-breakpoint
CREATE INDEX "SettlementModifier_modifierType_idx" ON "SettlementModifier" USING btree ("modifierType");--> statement-breakpoint
CREATE INDEX "SettlementModifier_lastCalculatedAt_idx" ON "SettlementModifier" USING btree ("lastCalculatedAt");