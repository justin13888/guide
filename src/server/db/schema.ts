import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  primaryKey,
  foreignKey,
  index,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";

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

// Define enums
export const relationTypeEnum = pgEnum("relation_type", ["AND", "OR"]);
export const restrictionTypeEnum = pgEnum("restriction_type", [
  "INCLUDE",
  "EXCLUDE",
]);

// -------------- Course tables --------------

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
    minLevel: varchar("min_level", { length: 5 }),

    fall: boolean("fall").notNull().default(false),
    winter: boolean("winter").notNull().default(false),
    spring: boolean("spring").notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.department, table.courseNumber] })],
);

// prereq tree
const prerequisiteNodesIdRef = () => prerequisiteNodes.id;

export const prerequisiteNodes = pgTable(
  "prerequisite_nodes",
  {
    id: serial("id").primaryKey(),

    parentId: integer("parent_id").references(prerequisiteNodesIdRef, {
      onDelete: "cascade",
    }),

    relationType: relationTypeEnum("relation_type"),

    department: varchar("department", { length: 10 }),
    courseNumber: varchar("course_number", { length: 10 }),
    minGrade: integer("min_grade"),
  },
  (table) => [
    {
      foreignKeys: [
        {
          columns: [table.department, table.courseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
      ],
    },
    index("idx_prerequisite_nodes_dept_course").on(
      table.department,
      table.courseNumber,
    ),
    index("idx_prerequisite_nodes_parent_id").on(table.parentId),
  ],
);

// course prereq
export const coursePrerequisites = pgTable(
  "course_prerequisites",
  {
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),

    rootNodeId: integer("root_node_id")
      .notNull()
      .references(() => prerequisiteNodes.id, { onDelete: "cascade" }),
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
    index("idx_course_prerequisites_root_node_id").on(table.rootNodeId),
  ],
);

// course program
export const courseProgramRestrictions = pgTable(
  "course_program_restrictions",
  {
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    program: varchar("program", { length: 50 }).notNull(),
    minLevel: varchar("min_level", { length: 5 }),
    restrictionType: restrictionTypeEnum("restriction_type").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.department, table.courseNumber, table.program],
    }),
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

export const antirequisites = pgTable(
  "antirequisites",
  {
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    antirequisiteDepartment: varchar("antirequisite_department", {
      length: 10,
    }).notNull(),
    antirequisiteCourseNumber: varchar("antirequisite_course_number", {
      length: 10,
    }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.department,
        table.courseNumber,
        table.antirequisiteDepartment,
        table.antirequisiteCourseNumber,
      ],
    }),
    {
      foreignKeys: [
        {
          columns: [table.department, table.courseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
        {
          columns: [
            table.antirequisiteDepartment,
            table.antirequisiteCourseNumber,
          ],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
      ],
    },
    index("idx_antirequisites_department_course").on(
      table.department,
      table.courseNumber,
    ),
    index("idx_antirequisites_antidept_anticourse").on(
      table.antirequisiteDepartment,
      table.antirequisiteCourseNumber,
    ),
  ],
);

export const corequisites = pgTable(
  "corequisites",
  {
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    corequisiteDepartment: varchar("corequisite_department", {
      length: 10,
    }).notNull(),
    corequisiteCourseNumber: varchar("corequisite_course_number", {
      length: 10,
    }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.department,
        table.courseNumber,
        table.corequisiteDepartment,
        table.corequisiteCourseNumber,
      ],
    }),
    {
      foreignKeys: [
        {
          columns: [table.department, table.courseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
        {
          columns: [table.corequisiteDepartment, table.corequisiteCourseNumber],
          foreignColumns: [courses.department, courses.courseNumber],
          onDelete: "cascade",
        },
      ],
    },
  ],
);

export const userCourseStatusEnum = pgEnum("user_course_status", [
  "taken",
  "planning",
]);

export const userCourses = pgTable(
  "user_courses",
  {
    userId: varchar("user_id", { length: 255 }).notNull(),
    department: varchar("department", { length: 10 }).notNull(),
    courseNumber: varchar("course_number", { length: 10 }).notNull(),
    status: userCourseStatusEnum("status").notNull(),
    levelTerm: varchar("level_term", { length: 5 }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.department, table.courseNumber],
      name: "user_courses_pk",
    }),
    foreignKey({
      columns: [table.department, table.courseNumber],
      foreignColumns: [courses.department, courses.courseNumber],
      name: "user_courses_course_fk",
    }).onDelete("cascade"),
  ],
);
