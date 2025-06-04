import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

// Courses table
export const courses = pgTable(
  "courses",
  {
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    title: text("title"),
    description: text("description"),
    requirements: text("requirements"),
  },
  (table) => [primaryKey({ columns: [table.department, table.courseNumber] })],
);

// Course Requirement Groups table
export const courseRequirementGroups = pgTable(
  "course_requirement_groups",
  {
    id: serial("id").primaryKey(),
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    outerRelationType: varchar("outer_relation_type", { length: 3 }).notNull(),
  },
  (table) => [
    sql`CHECK (${table.outerRelationType} IN ('AND', 'OR'))`,
    primaryKey({ columns: [table.id] }),
    {
      foreignKeys: [
        {
          columns: [table.department, table.courseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
      ],
    },
  ],
);

// Course Requirements table
export const courseRequirements = pgTable(
  "course_requirements",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => courseRequirementGroups.id, { onDelete: "cascade" }),
    relatedDepartment: varchar("related_department", { length: 10 }).notNull(),
    relatedCourseNumber: varchar("related_course_number", {
      length: 10,
    }).notNull(),
    innerRelationType: varchar("inner_relation_type", { length: 3 }).notNull(),
    minGrade: integer("min_grade"),
    isAntireq: boolean("is_antireq").notNull().default(false),
    isCoreq: boolean("is_coreq").notNull().default(false),
  },
  (table) => [
    sql`CHECK (${table.innerRelationType} IN ('AND', 'OR'))`,
    {
      foreignKeys: [
        {
          columns: [table.relatedDepartment, table.relatedCourseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
      ],
    },
  ],
);

// Terms Offered Table table
export const termOffered = pgTable(
  "term_offered",
  {
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    fall: boolean().notNull().default(false),
    winter: boolean().notNull().default(false),
    spring: boolean().notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.department, table.courseNumber] }),
    {
      foreignKeys: [
        {
          columns: [table.department, table.courseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
      ],
    },
  ],
);

// Course Restrictions table
export const courseRestrictions = pgTable(
  "course_restrictions",
  {
    id: serial("id").primaryKey(),
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    requirementType: varchar("requirement_type", { length: 10 }).notNull(),
    value: text("value").notNull(),
  },
  (table) => [
    sql`CHECK (${table.requirementType} IN ('LEVEL', 'PROGRAM', 'FACULTY'))`,
    {
      foreignKeys: [
        {
          columns: [table.department, table.courseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
      ],
    },
  ],
);
