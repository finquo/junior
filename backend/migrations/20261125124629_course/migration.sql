CREATE TABLE "course" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"language" text NOT NULL,
	"price" jsonb DEFAULT '{}' NOT NULL,
	"modules" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"course" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"quiz" jsonb,
	"videos" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_anwser" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"studentId" text NOT NULL,
	"moduleId" text NOT NULL,
	"status" "answer_status" DEFAULT 'pending'::"answer_status" NOT NULL,
	"answer" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"course" text NOT NULL,
	"module" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_payment" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"studentId" text NOT NULL,
	"course" text NOT NULL,
	"transactionId" text,
	"amount" integer NOT NULL,
	"paidAt" timestamp,
	"currency" char(3) NOT NULL,
	"paymentMethod" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amount_positive" CHECK ("amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "answer" RENAME TO "lesson_anwser";--> statement-breakpoint
ALTER TABLE "payment" RENAME TO "program_payment";--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN "course" text;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN "attendedModules" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN "watchedVideos" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
CREATE INDEX "course_name_trigram_idx" ON "course" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "module_name_trigram_idx" ON "module" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "video_name_trigram_idx" ON "video" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "program_name_trigram_idx" ON "program" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "module" ADD CONSTRAINT "module_course_course_id_fkey" FOREIGN KEY ("course") REFERENCES "course"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "module_anwser" ADD CONSTRAINT "module_anwser_studentId_student_id_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "module_anwser" ADD CONSTRAINT "module_anwser_moduleId_module_id_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_course_course_id_fkey" FOREIGN KEY ("course") REFERENCES "course"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_module_module_id_fkey" FOREIGN KEY ("module") REFERENCES "module"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "course_payment" ADD CONSTRAINT "course_payment_studentId_student_id_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "course_payment" ADD CONSTRAINT "course_payment_course_course_id_fkey" FOREIGN KEY ("course") REFERENCES "course"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_course_course_id_fkey" FOREIGN KEY ("course") REFERENCES "course"("id");