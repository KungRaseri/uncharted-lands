ALTER TABLE "Account" ADD COLUMN "lastSeen" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "Account" ADD COLUMN "isOnline" boolean DEFAULT false NOT NULL;