CREATE TYPE "public"."restriction_type" AS ENUM('INCLUDE', 'EXCLUDE');--> statement-breakpoint
ALTER TABLE "course_level_requirements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "course_level_requirements" CASCADE;--> statement-breakpoint
ALTER TABLE "course_program_restrictions" DROP CONSTRAINT "course_program_restrictions_department_course_number_program_pk";--> statement-breakpoint
ALTER TABLE "course_program_restrictions" ALTER COLUMN "restriction_type" SET DATA TYPE restriction_type;--> statement-breakpoint
ALTER TABLE "course_program_restrictions" ADD CONSTRAINT "course_program_restrictions_department_course_number_program_min_level_pk" PRIMARY KEY("department","course_number","program","min_level");--> statement-breakpoint
ALTER TABLE "course_program_restrictions" ADD COLUMN "min_level" varchar(5);--> statement-breakpoint
DROP TYPE "public"."requirement_type";