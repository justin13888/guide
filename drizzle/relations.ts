import { relations } from "drizzle-orm/relations";
import { prerequisiteNodes, user, session, post, coursePrerequisites, account } from "./schema";

export const prerequisiteNodesRelations = relations(prerequisiteNodes, ({one, many}) => ({
	prerequisiteNode: one(prerequisiteNodes, {
		fields: [prerequisiteNodes.parentId],
		references: [prerequisiteNodes.id],
		relationName: "prerequisiteNodes_parentId_prerequisiteNodes_id"
	}),
	prerequisiteNodes: many(prerequisiteNodes, {
		relationName: "prerequisiteNodes_parentId_prerequisiteNodes_id"
	}),
	coursePrerequisites: many(coursePrerequisites),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	posts: many(post),
	accounts: many(account),
}));

export const postRelations = relations(post, ({one}) => ({
	user: one(user, {
		fields: [post.createdById],
		references: [user.id]
	}),
}));

export const coursePrerequisitesRelations = relations(coursePrerequisites, ({one}) => ({
	prerequisiteNode: one(prerequisiteNodes, {
		fields: [coursePrerequisites.rootNodeId],
		references: [prerequisiteNodes.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));