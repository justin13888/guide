CREATE TYPE "public"."user_course_status" AS ENUM('taken', 'planning');--> statement-breakpoint
CREATE TABLE "user_courses" (
	"user_id" varchar(255) NOT NULL,
	"department" varchar(10) NOT NULL,
	"course_number" varchar(10) NOT NULL,
	"status" "user_course_status" NOT NULL,
	"level_term" varchar(5),
	CONSTRAINT "user_courses_user_id_department_course_number_pk" PRIMARY KEY("user_id","department","course_number")
);
--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_department_courses_department_fk" FOREIGN KEY ("department") REFERENCES "public"."courses"("department") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_course_number_courses_course_number_fk" FOREIGN KEY ("course_number") REFERENCES "public"."courses"("course_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_courses_user_id" ON "user_courses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_courses_dept_course" ON "user_courses" USING btree ("department","course_number");--> statement-breakpoint
CREATE INDEX "idx_antirequisites_department_course" ON "antirequisites" USING btree ("department","course_number");--> statement-breakpoint
CREATE INDEX "idx_antirequisites_antidept_anticourse" ON "antirequisites" USING btree ("antirequisite_department","antirequisite_course_number");--> statement-breakpoint
CREATE INDEX "idx_course_prerequisites_root_node_id" ON "course_prerequisites" USING btree ("root_node_id");--> statement-breakpoint
CREATE INDEX "idx_prerequisite_nodes_dept_course" ON "prerequisite_nodes" USING btree ("department","course_number");--> statement-breakpoint
CREATE INDEX "idx_prerequisite_nodes_parent_id" ON "prerequisite_nodes" USING btree ("parent_id");