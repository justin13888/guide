ALTER TABLE "user_courses" DROP CONSTRAINT "user_courses_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "idx_user_courses_user_id";--> statement-breakpoint
DROP INDEX "idx_user_courses_dept_course";--> statement-breakpoint
ALTER TABLE "user_courses" DROP CONSTRAINT "user_courses_user_id_department_course_number_pk";--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_pk" PRIMARY KEY("user_id","department","course_number");--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_course_fk" FOREIGN KEY ("department","course_number") REFERENCES "public"."courses"("department","course_number") ON DELETE cascade ON UPDATE no action;