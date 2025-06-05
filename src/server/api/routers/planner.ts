import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { planSchema, type Plan } from "~/models";

export const plannerRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  updatePlan: protectedProcedure
    .input(z.object({ plan: planSchema }))
    .mutation(async ({ ctx, input }) => {
      // TODO
      const obj = {
        userId: ctx.session.user.id,
        plan: input.plan,
      };
      console.log("Updating plan to:", obj);

      return obj;
    }),

  getCurrentPlans: protectedProcedure.query(async ({ ctx }) => {
    // TODO
    return ["bcs-coop"] satisfies Plan[];
    // const post = await ctx.db.query.posts.findFirst({
    //   orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    // });

    // return post ?? null;
  }),
});
