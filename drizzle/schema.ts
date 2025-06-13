import { pgTable, foreignKey, serial, integer, varchar, index, timestamp, primaryKey, text, real, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const relationType = pgEnum("relation_type", ['AND', 'OR'])
export const restrictionType = pgEnum("restriction_type", ['INCLUDE', 'EXCLUDE'])


export const prerequisiteNodes = pgTable("prerequisite_nodes", {
	id: serial().primaryKey().notNull(),
	parentId: integer("parent_id"),
	relationType: relationType("relation_type"),
	department: varchar({ length: 10 }),
	courseNumber: varchar("course_number", { length: 10 }),
	minGrade: integer("min_grade"),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "prerequisite_nodes_parent_id_prerequisite_nodes_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	sessionToken: varchar({ length: 255 }).primaryKey().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("t_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}),
]);

export const user = pgTable("user", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	image: varchar({ length: 255 }),
});

export const post = pgTable("post", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "post_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 256 }),
	createdById: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("created_by_idx").using("btree", table.createdById.asc().nullsLast().op("text_ops")),
	index("name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [user.id],
			name: "post_createdById_user_id_fk"
		}),
]);

export const coursePrerequisites = pgTable("course_prerequisites", {
	department: varchar({ length: 10 }).notNull(),
	courseNumber: varchar("course_number", { length: 10 }).notNull(),
	rootNodeId: integer("root_node_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.rootNodeId],
			foreignColumns: [prerequisiteNodes.id],
			name: "course_prerequisites_root_node_id_prerequisite_nodes_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.department, table.courseNumber], name: "course_prerequisites_department_course_number_pk"}),
]);

export const verificationToken = pgTable("verification_token", {
	identifier: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verification_token_identifier_token_pk"}),
]);

export const antirequisites = pgTable("antirequisites", {
	department: varchar({ length: 10 }).notNull(),
	courseNumber: varchar("course_number", { length: 10 }).notNull(),
	antirequisiteDepartment: varchar("antirequisite_department", { length: 10 }).notNull(),
	antirequisiteCourseNumber: varchar("antirequisite_course_number", { length: 10 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.department, table.courseNumber, table.antirequisiteDepartment, table.antirequisiteCourseNumber], name: "antirequisites_department_course_number_antirequisite_departmen"}),
]);

export const corequisites = pgTable("corequisites", {
	department: varchar({ length: 10 }).notNull(),
	courseNumber: varchar("course_number", { length: 10 }).notNull(),
	corequisiteDepartment: varchar("corequisite_department", { length: 10 }).notNull(),
	corequisiteCourseNumber: varchar("corequisite_course_number", { length: 10 }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.department, table.courseNumber, table.corequisiteDepartment, table.corequisiteCourseNumber], name: "corequisites_department_course_number_corequisite_department_co"}),
]);

export const courseProgramRestrictions = pgTable("course_program_restrictions", {
	department: varchar({ length: 10 }).notNull(),
	courseNumber: varchar("course_number", { length: 10 }).notNull(),
	program: varchar({ length: 50 }).notNull(),
	minLevel: varchar("min_level", { length: 5 }),
	restrictionType: restrictionType("restriction_type").notNull(),
}, (table) => [
	primaryKey({ columns: [table.department, table.courseNumber, table.program], name: "course_program_restrictions_department_course_number_program_pk"}),
]);

export const courses = pgTable("courses", {
	department: varchar({ length: 10 }).notNull(),
	courseNumber: varchar("course_number", { length: 10 }).notNull(),
	title: text(),
	description: text(),
	requirements: text(),
	units: real(),
	fall: boolean().default(false).notNull(),
	winter: boolean().default(false).notNull(),
	spring: boolean().default(false).notNull(),
	minLevel: varchar("min_level", { length: 5 }),
}, (table) => [
	primaryKey({ columns: [table.department, table.courseNumber], name: "courses_department_course_number_pk"}),
]);

export const account = pgTable("account", {
	userId: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerAccountId: varchar({ length: 255 }).notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: varchar("token_type", { length: 255 }),
	scope: varchar({ length: 255 }),
	idToken: text("id_token"),
	sessionState: varchar("session_state", { length: 255 }),
}, (table) => [
	index("account_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
]);
