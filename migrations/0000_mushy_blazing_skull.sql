CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" integer
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer,
	"user_id" integer,
	"is_admin" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"creator_id" integer,
	"is_announcement" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer,
	"group_id" integer,
	"content" text NOT NULL,
	"timestamp" date NOT NULL,
	"is_read" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_subdivision_id" integer NOT NULL,
	"cabinet" text NOT NULL,
	"phone" text NOT NULL,
	"task_id" integer NOT NULL,
	"custom_title" text,
	"comment" text,
	"status" text DEFAULT 'новая' NOT NULL,
	"created_at" timestamp NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subdivisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"isonline" integer DEFAULT 0,
	"avatarurl" text,
	"department_id" integer,
	"job_title" text,
	"language" text DEFAULT 'en'
);
--> statement-breakpoint
CREATE TABLE "wiki_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"creator_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"last_editor_id" integer,
	"category" text
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_receiver_subdivision_id_subdivisions_id_fk" FOREIGN KEY ("receiver_subdivision_id") REFERENCES "public"."subdivisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_task_id_tasks_catalog_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_entries" ADD CONSTRAINT "wiki_entries_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_entries" ADD CONSTRAINT "wiki_entries_last_editor_id_users_id_fk" FOREIGN KEY ("last_editor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;