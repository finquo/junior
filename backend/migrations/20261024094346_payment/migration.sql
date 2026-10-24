CREATE TYPE "order_status" AS ENUM('delivered', 'packing');--> statement-breakpoint
CREATE TABLE "material" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"studentId" text NOT NULL,
	"schedulerId" text NOT NULL,
	"lessons" text[] DEFAULT '{}'::text[] NOT NULL,
	"order" "order_status" DEFAULT 'packing'::"order_status" NOT NULL,
	"shippingAddress" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"studentId" text NOT NULL,
	"program" text NOT NULL,
	"transactionId" text,
	"amount" integer NOT NULL,
	"paidAt" timestamp,
	"currency" char(3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amount_positive" CHECK ("amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_studentId_student_id_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_schedulerId_scheduler_id_fkey" FOREIGN KEY ("schedulerId") REFERENCES "scheduler"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_studentId_student_id_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id");--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_program_program_id_fkey" FOREIGN KEY ("program") REFERENCES "program"("id");