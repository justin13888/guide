import { postRouter } from "~/server/api/routers/post";
import { seedRouter } from "~/server/api/routers/seed";
import { plannerRouter } from "~/server/api/routers/planner";
import { requirementsRouter } from "~/server/api/routers/requirements";
import { prereqsWithOfferingsRouter } from "~/server/api/routers/prereqsterms";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  seed: seedRouter,
  planner: plannerRouter,
  requirements: requirementsRouter,
  prereqsWithOfferings: prereqsWithOfferingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
