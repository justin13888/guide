import { z } from 'zod';

// TODO: Update
export const planSchema = z.union([
    z.literal("bse-honour"),
    z.literal("bcs-coop"),
]);
export type Plan = z.infer<typeof planSchema>;
