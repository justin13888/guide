import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
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
    id: serial("id").primaryKey(),
    courseCode: varchar("course_code", { length: 10 }).unique().notNull(),
    title: text("title"),
    description: text("description"),
    requirements: text("requirements"),
  },
);

// Course Requirement Groups table
export const courseRequirementGroups = pgTable(
  "course_requirement_groups",
  {
    id: serial("id").primaryKey(),
    courseCode: varchar("course_code", { length: 10 })
      .notNull()
      .references(() => courses.courseCode, { onDelete: "cascade" }),
    outerRelationType: varchar("outer_relation_type", { length: 3 }).notNull(),
  },
  (table) => [sql`CHECK (${table.outerRelationType} IN ('AND', 'OR'))`],
);

// Course Requirements table
export const courseRequirements = pgTable(
  "course_requirements",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => courseRequirementGroups.id, { onDelete: "cascade" }),
    relatedCourse: varchar("related_course", { length: 10 }).notNull(),
    innerRelationType: varchar("inner_relation_type", { length: 3 }).notNull(),
    minGrade: integer("min_grade"),
    isAntireq: boolean("is_antireq").notNull().default(false),
    isCoreq: boolean("is_coreq").notNull().default(false),
  },
  (table) => [sql`CHECK (${table.innerRelationType} IN ('AND', 'OR'))`],
);

// Terms Offered Table table
export const termOffered = pgTable(
  "term_offered",
  {
    courseCode: varchar("course_code", { length: 10 })
    .notNull()
    .primaryKey()
      .references(() => courses.courseCode, { onDelete: "cascade" }),
    fall: boolean().notNull().default(false),
    winter: boolean().notNull().default(false),
    spring: boolean().notNull().default(false),
  },
);

// Course Restrictions table
export const courseRestrictions = pgTable(
  "course_restrictions",
  {
    id: serial("id").primaryKey(),
    courseCode: varchar("course_code", { length: 10 })
      .notNull()
      .references(() => courses.courseCode, { onDelete: "cascade" }),
    requirementType: varchar("requirement_type", { length: 10 }).notNull(),
    value: text("value").notNull(),
  },
  (table) => [
    sql`CHECK (${table.requirementType} IN ('LEVEL', 'PROGRAM', 'FACULTY'))`,
  ],
);
