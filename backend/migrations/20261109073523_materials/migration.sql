ALTER TABLE "material" ADD COLUMN "programMaterialId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "program" ADD COLUMN "materials" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "paymentMethod" text NOT NULL;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN "currentAddress" jsonb;