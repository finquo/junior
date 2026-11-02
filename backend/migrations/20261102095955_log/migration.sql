CREATE TABLE "slot_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"slotId" text NOT NULL,
	"category" text NOT NULL,
	"event" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "slot_log_idx" ON "slot_log" ("slotId","created_at");--> statement-breakpoint
ALTER TABLE "slot_log" ADD CONSTRAINT "slot_log_slotId_slot_id_fkey" FOREIGN KEY ("slotId") REFERENCES "slot"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "phone_number_e164_check" CHECK ("phone_number" IS NULL OR "phone_number" ~ '^\+[1-9]\d{6,14}$');