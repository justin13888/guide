import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  primaryKey,
  index,
  real,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

// TODO: Replace crypto.randomUUID() with uuidv7 and use stricter uuid column type

// TODO: Remove this vv
export const posts = pgTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = pgTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
}));

export const accounts = pgTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = pgTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = pgTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// Courses table
export const courses = pgTable(
  "courses",
  {
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    title: text("title"),
    description: text("description"),
    requirements: text("requirements"),
    units: real("units"),
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

// Terms Offered Tabzle
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
