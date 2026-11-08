ALTER TABLE "slot" ADD COLUMN "sessionKey" text;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN "participants" jsonb[] DEFAULT '{}'::jsonb[] NOT NULL;