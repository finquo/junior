CREATE TABLE "feedback" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" text,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"ref" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolvedBy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_resolvedBy_user_id_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "user"("id") ON DELETE SET NULL;