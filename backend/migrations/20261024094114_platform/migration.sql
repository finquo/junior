CREATE TYPE "answer_status" AS ENUM('pending', 'answered', 'correct', 'partially_correct', 'wrong', 'retake');--> statement-breakpoint
CREATE TYPE "slot_status" AS ENUM('scheduled', 'request_reschedule', 'rescheduled', 'started', 'attended');--> statement-breakpoint
CREATE TABLE "answer" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"studentId" text NOT NULL,
	"lessonId" text NOT NULL,
	"status" "answer_status" DEFAULT 'pending'::"answer_status" NOT NULL,
	"answer" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"language" text NOT NULL,
	"program" text NOT NULL,
	"quiz" jsonb,
	"period" interval hour to minute DEFAULT INTERVAL '1' HOUR,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"price" jsonb DEFAULT '{}' NOT NULL,
	"lessons" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slot" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"meetingLink" text,
	"studentId" text NOT NULL,
	"teacherId" text NOT NULL,
	"schedulerId" text NOT NULL,
	"lessonId" text NOT NULL,
	"startTime" timestamp with time zone NOT NULL,
	"expectedEndTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone,
	"status" "slot_status" DEFAULT 'scheduled'::"slot_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "lesson_name_trigram_idx" ON "lesson" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "slot_teacher_student_idx" ON "slot" ("teacherId","studentId","lessonId");--> statement-breakpoint
CREATE INDEX "slot_teacher_status_time_idx" ON "slot" ("teacherId","status","startTime","expectedEndTime");--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_studentId_student_id_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "answer" ADD CONSTRAINT "answer_lessonId_lesson_id_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_program_program_id_fkey" FOREIGN KEY ("program") REFERENCES "program"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_studentId_student_id_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_teacherId_teacher_id_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_schedulerId_scheduler_id_fkey" FOREIGN KEY ("schedulerId") REFERENCES "scheduler"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_lessonId_lesson_id_fkey" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE;