CREATE TABLE "student" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"mentorId" text,
	"supervisorId" text,
	"notes" jsonb DEFAULT '[]' NOT NULL,
	"address" jsonb,
	"age" smallint,
	"grade" smallint,
	"schooling" text,
	"country" char(2),
	"languages" text[],
	"program" text,
	"attendedLessons" text[] DEFAULT '{}'::text[] NOT NULL,
	"currency" char(3),
	"paid" boolean NOT NULL,
	"amount" integer NOT NULL,
	"remaining" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amount_positive" CHECK ("amount" >= 0),
	CONSTRAINT "remaining_positive" CHECK ("remaining" >= 0),
	CONSTRAINT "age_range_check" CHECK ("age" >= 0 AND "age" <= 120),
	CONSTRAINT "grade_range_check" CHECK ("grade" >= 1 AND "grade" <= 12)
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
CREATE TABLE "scheduler" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"supervisorId" text,
	"experiences" jsonb DEFAULT '[]',
	"languages" text[],
	"availability" jsonb,
	"leaves" tstzrange[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_id_user_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_mentorId_teacher_id_fkey" FOREIGN KEY ("mentorId") REFERENCES "teacher"("id");--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_supervisorId_scheduler_id_fkey" FOREIGN KEY ("supervisorId") REFERENCES "scheduler"("id");--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_program_program_id_fkey" FOREIGN KEY ("program") REFERENCES "program"("id");--> statement-breakpoint
ALTER TABLE "scheduler" ADD CONSTRAINT "scheduler_id_user_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_id_user_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_supervisorId_scheduler_id_fkey" FOREIGN KEY ("supervisorId") REFERENCES "scheduler"("id") ON DELETE CASCADE;