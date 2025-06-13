CREATE TABLE "antirequisites" (
	"department" varchar(10) NOT NULL,
	"course_number" varchar(10) NOT NULL,
	"antirequisite_department" varchar(10) NOT NULL,
	"antirequisite_course_number" varchar(10) NOT NULL,
	CONSTRAINT "antirequisites_department_course_number_antirequisite_department_antirequisite_course_number_pk" PRIMARY KEY("department","course_number","antirequisite_department","antirequisite_course_number")
);
--> statement-breakpoint
CREATE TABLE "corequisites" (
	"department" varchar(10) NOT NULL,
	"course_number" varchar(10) NOT NULL,
	"corequisite_department" varchar(10) NOT NULL,
	"corequisite_course_number" varchar(10) NOT NULL,
	CONSTRAINT "corequisites_department_course_number_corequisite_department_corequisite_course_number_pk" PRIMARY KEY("department","course_number","corequisite_department","corequisite_course_number")
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "min_level" varchar(5);