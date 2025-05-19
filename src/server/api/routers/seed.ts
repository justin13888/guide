import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { courses } from "~/server/db/schema";
import { like } from "drizzle-orm";
import { env } from "~/env";

// curl -X POST http://localhost:3000/api/trpc/seed.seed \
//   -H "Content-Type: application/json" \
//   -d '{"json":{"term":"1255","subject":"cs"}}'

export const seedRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z
        .object({
          level: z.enum(["1XX", "2XX", "3XX", "4XX"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const query = ctx.db
        .select({
          courseId: courses.courseId,
          title: courses.title,
          description: courses.description,
          catalogNumber: courses.catalogNumber,
        })
        .from(courses);

      if (input?.level) {
        query.where(like(courses.catalogNumber, `${input.level.slice(0, 1)}%`));
      }

      return await query;
    }),

  seed: publicProcedure
    .input(
      z.object({
        term: z.string().default("1255"), // default to Spring 2025
        subject: z.string().default("cs"), // default to cs
      }),
    )
    .mutation(async ({ input }) => {
      const apiKey = env.UWATERLOO_OPENDATA_API_KEY;

      if (!apiKey) {
        throw new Error("API key not configured");
      }

      const response = await fetch(
        `https://openapi.data.uwaterloo.ca/v3/Courses/${input.term}/${input.subject}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );

      const data = await response.json();

      // Transform the data to include only selected fields
      const transformedData = data.map((course: any) => ({
        courseId: course.courseId,
        title: course.title,
        subjectCode: course.subjectCode,
        catalogNumber: course.catalogNumber,
        description: course.description,
        requirementsDescription: course.requirementsDescription,
      }));

      // Filter for undergrad courses (1XX-4XX)
      const undergradCourses = transformedData.filter((course: any) => {
        const courseNumber = parseInt(course.catalogNumber);
        return courseNumber >= 100 && courseNumber < 500;
      });

      return undergradCourses[0];
    }),
});
