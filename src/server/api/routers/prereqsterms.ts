import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { sql } from "drizzle-orm";

/**
 * tRPC router for fetching all prerequisites (including nested ones) for a given course,
 * along with their term offerings. The user provides department and courseNumber.
 */
export const prereqsWithOfferingsRouter = createTRPCRouter({
  getCoursePrereqs: publicProcedure // TODO: Change to protectedProcedure when there's time to fix
    .input(
      z.object({
        department: z.string(),
        courseNumber: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { department, courseNumber } = input;
      // SQL query to get all prerequisites (including nested ones) for the given course
      const prereqsQuery = sql`
        WITH RECURSIVE prereq_base (
          id, department, course_number, min_grade, path
        ) AS (
          SELECT
            pn.id,
            pn.department,
            pn.course_number,
            pn.min_grade,
            ARRAY[pn.id]
          FROM course_prerequisites cp
          JOIN prerequisite_nodes pn ON cp.root_node_id = pn.id
          WHERE cp.department = ${department} AND cp.course_number = ${courseNumber}

          UNION ALL

          SELECT
            child.id,
            child.department,
            child.course_number,
            child.min_grade,
            pb.path || child.id
          FROM prereq_base pb
          JOIN (
            SELECT
              pn.*,
              ROW_NUMBER() OVER (PARTITION BY pn.parent_id ORDER BY pn.id) AS rn
            FROM prerequisite_nodes pn
          ) child ON child.parent_id = pb.id
          JOIN prerequisite_nodes parent ON parent.id = pb.id
          WHERE NOT child.id = ANY(pb.path)
            AND (
              parent.relation_type = 'AND' OR
              (parent.relation_type = 'OR' AND child.rn = 1)
            )
        ),

        nested_courses (
          id, department, course_number, min_grade, path
        ) AS (
          SELECT
            pn2.id,
            pn2.department,
            pn2.course_number,
            pn2.min_grade,
            pb.path || pn2.id
          FROM prereq_base pb
          JOIN course_prerequisites cp2 ON cp2.department = pb.department AND cp2.course_number = pb.course_number
          JOIN prerequisite_nodes pn2 ON cp2.root_node_id = pn2.id
          WHERE NOT pn2.id = ANY(pb.path)

          UNION ALL

          SELECT
            child.id,
            child.department,
            child.course_number,
            child.min_grade,
            nc.path || child.id
          FROM nested_courses nc
          JOIN (
            SELECT
              pn.*,
              ROW_NUMBER() OVER (PARTITION BY pn.parent_id ORDER BY pn.id) AS rn
            FROM prerequisite_nodes pn
          ) child ON child.parent_id = nc.id
          JOIN prerequisite_nodes parent ON parent.id = nc.id
          WHERE NOT child.id = ANY(nc.path)
            AND (
              parent.relation_type = 'AND' OR
              (parent.relation_type = 'OR' AND child.rn = 1)
            )
        ),

        all_courses AS (
          SELECT department, course_number, min_grade FROM prereq_base
          UNION
          SELECT department, course_number, min_grade FROM nested_courses
        ),

        target_course AS (
          SELECT department, course_number, NULL::integer AS min_grade, fall, winter, spring
          FROM courses
          WHERE department = ${department} AND course_number = ${courseNumber}
        ),

        unique_courses AS (
          SELECT ac.department, ac.course_number, ac.min_grade, c.fall, c.winter, c.spring
          FROM all_courses ac
          JOIN courses c ON c.department = ac.department AND c.course_number = ac.course_number
          UNION
          SELECT department, course_number, min_grade, fall, winter, spring FROM target_course
        )

        SELECT DISTINCT ON (department, course_number)
          department,
          course_number,
          min_grade,
          fall,
          winter,
          spring
        FROM unique_courses
        ORDER BY department, course_number;
      `;

      try {
        const results = await ctx.db.execute(prereqsQuery);
        // Return the results as a JSON array
        return results.map((row) => ({
          department: row.department as string,
          courseNumber: row.course_number as string,
          minGrade: row.min_grade as number | null,
          fall: row.fall as boolean,
          winter: row.winter as boolean,
          spring: row.spring as boolean,
        }));
      } catch (error) {
        // Handle and log errors
        console.error("Failed to fetch prerequisites:", error);
        throw new Error("Failed to fetch prerequisites");
      }
    }),
});
