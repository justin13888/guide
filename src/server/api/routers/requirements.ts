import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { planSchema, type Plan, type ProgramRequirements } from "~/models";
import { softwareEngineeringHonoursRequirement } from "~/server/constants";

export const requirementsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }): Promise<ProgramRequirements | undefined> => {
      // TODO
      const { id } = input;

      console.log(`Fetching requirements for ${id}`);

      return softwareEngineeringHonoursRequirement
    }),
});
