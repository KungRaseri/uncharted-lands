ALTER TABLE "Structure" ADD COLUMN "tier" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "Structure" ADD COLUMN "constructionTimeSeconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Structure" ADD COLUMN "populationRequired" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Structure" ADD COLUMN "displayName" text NOT NULL;