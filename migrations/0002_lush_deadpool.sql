ALTER TABLE "requests" ALTER COLUMN "cabinet" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "is_urgent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "who_accepted" integer;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "taken_at" timestamp;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "grade" integer;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "review_text" text;--> statement-breakpoint
ALTER TABLE "tasks_catalog" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks_catalog" ADD COLUMN "category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_who_accepted_users_id_fk" FOREIGN KEY ("who_accepted") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "custom_title";--> statement-breakpoint
ALTER TABLE "tasks_catalog" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "firstname";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "lastname";