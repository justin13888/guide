import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { planSchema, type Plan, type PrerequisiteChainsResponse } from "~/models";
import { courses } from "~/server/db/schema";
import { eq, and, sql } from "drizzle-orm";

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

  getCurrentPlans: protectedProcedure.query(async ({ ctx: _ctx }) => {
    // TODO
    return ["bcs-coop"] satisfies Plan[];
    // const post = await ctx.db.query.posts.findFirst({
    //   orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    // });

    // return post ?? null;
  }),

  getPrerequisiteChains: protectedProcedure
    .input(z.object({ 
      department: z.string(), 
      courseNumber: z.string(),
      maxDepth: z.number().default(10).optional()
    }))
    .query(async ({ ctx, input }): Promise<PrerequisiteChainsResponse> => {
      const { department, courseNumber, maxDepth = 10 } = input;

      // First, check if the course exists
      const targetCourse = await ctx.db.query.courses.findFirst({
        where: and(
          eq(courses.department, department),
          eq(courses.courseNumber, courseNumber)
        ),
      });

      if (!targetCourse) {
        throw new Error(`Course ${department} ${courseNumber} not found`);
      }

      // Use a recursive CTE to find all prerequisite paths
      const prerequisitePathsQuery = sql`
        WITH RECURSIVE prereq_paths AS (
          -- Base case: Start from the root prerequisite node for the target course
          SELECT 
            pn.id,
            pn.parent_id,
            pn.relation_type,
            pn.department,
            pn.course_number,
            pn.min_grade,
            c.title,
            0 as depth,
            CASE 
              WHEN pn.department IS NOT NULL AND pn.course_number IS NOT NULL 
              THEN ARRAY[pn.department || ' ' || pn.course_number]
              ELSE ARRAY[]::text[]
            END as path_array,
            CASE 
              WHEN pn.department IS NOT NULL AND pn.course_number IS NOT NULL 
              THEN pn.department || ' ' || pn.course_number
              ELSE ''
            END as path_string,
            cp.root_node_id as original_root
          FROM course_prerequisites cp
          JOIN prerequisite_nodes pn ON pn.id = cp.root_node_id
          LEFT JOIN courses c ON pn.department = c.department AND pn.course_number = c.course_number
          WHERE cp.department = ${department} AND cp.course_number = ${courseNumber}

          UNION ALL

          -- Recursive case: Traverse child nodes based on relation types
          SELECT 
            child.id,
            child.parent_id,
            child.relation_type,
            child.department,
            child.course_number,
            child.min_grade,
            c.title,
            pp.depth + 1,
            CASE 
              WHEN child.department IS NOT NULL AND child.course_number IS NOT NULL 
              THEN 
                CASE 
                  WHEN pp.path_array = ARRAY[]::text[] 
                  THEN ARRAY[child.department || ' ' || child.course_number]
                  ELSE pp.path_array || (child.department || ' ' || child.course_number)
                END
              ELSE pp.path_array
            END,
            CASE 
              WHEN child.department IS NOT NULL AND child.course_number IS NOT NULL 
              THEN 
                CASE 
                  WHEN pp.path_string = '' 
                  THEN child.department || ' ' || child.course_number
                  ELSE pp.path_string || ' -> ' || child.department || ' ' || child.course_number
                END
              ELSE pp.path_string
            END,
            pp.original_root
          FROM prereq_paths pp
          JOIN prerequisite_nodes child ON child.parent_id = pp.id
          LEFT JOIN courses c ON child.department = c.department AND child.course_number = c.course_number
          WHERE pp.depth < ${maxDepth}
            AND (child.department IS NULL OR child.course_number IS NULL OR 
                 NOT (child.department || ' ' || child.course_number = ANY(pp.path_array)))
        ),
        -- Extract only the leaf nodes (actual courses) from the prerequisite tree
        leaf_courses AS (
          SELECT DISTINCT
            pp.department,
            pp.course_number,
            pp.title,
            pp.depth,
            pp.path_string,
            pp.path_array,
            pp.original_root,
            -- Determine if this is part of an AND or OR relationship by checking parent
            COALESCE(parent.relation_type, 'AND') as parent_relation
          FROM prereq_paths pp
          LEFT JOIN prerequisite_nodes parent ON parent.id = pp.parent_id
          WHERE pp.department IS NOT NULL 
            AND pp.course_number IS NOT NULL
            -- Only include leaf nodes (courses that don't have children in our tree)
            AND NOT EXISTS (
              SELECT 1 FROM prerequisite_nodes child 
              WHERE child.parent_id = pp.id
            )
        )
        SELECT DISTINCT
          department,
          course_number,
          title,
          depth,
          path_string,
          path_array,
          parent_relation
        FROM leaf_courses
        ORDER BY depth, department, course_number;
      `;

      const rawResults = await ctx.db.execute(prerequisitePathsQuery);
      
      // Group results by relationship type and process paths
      const pathsByRelation = new Map<string, Array<{
        department: string;
        courseNumber: string;
        title?: string;
        depth: number;
        pathString: string;
        pathArray: string[];
        parentRelation: string;
      }>>();

      let maxDepthFound = 0;
      
      for (const row of rawResults) {
        const dept = row.department as string;
        const courseNum = row.course_number as string;
        const title = row.title as string | null;
        const depth = row.depth as number;
        const pathString = row.path_string as string;
        const pathArray = row.path_array as string[];
        const parentRelation = row.parent_relation as string;
        
        maxDepthFound = Math.max(maxDepthFound, depth);
        
        const relationKey = parentRelation || 'SINGLE';
        
        if (!pathsByRelation.has(relationKey)) {
          pathsByRelation.set(relationKey, []);
        }
        
        pathsByRelation.get(relationKey)!.push({
          department: dept,
          courseNumber: courseNum,
          title: title ?? undefined,
          depth,
          pathString,
          pathArray,
          parentRelation: relationKey,
        });
      }

      // Process paths based on relationship types
      const allPaths: Array<{
        department: string;
        courseNumber: string;
        title?: string;
        path: Array<{
          department: string;
          courseNumber: string;
          title?: string;
        }>;
        depth: number;
        relationContext?: string;
      }> = [];

      // Handle different relationship types
      for (const [relationType, courses] of pathsByRelation) {
        for (const courseInfo of courses) {
          // Parse path array to create structured path
          const pathCourses = courseInfo.pathArray
            .filter(courseStr => courseStr.trim() !== '')
            .map(courseStr => {
              const [pathDept, pathCourseNum] = courseStr.split(' ');
              return {
                department: pathDept!,
                courseNumber: pathCourseNum!,
                title: undefined // We could join this if needed
              };
            });

          allPaths.push({
            department: courseInfo.department,
            courseNumber: courseInfo.courseNumber,
            title: courseInfo.title,
            path: pathCourses,
            depth: courseInfo.depth,
            relationContext: relationType === 'SINGLE' ? undefined : 
              relationType === 'AND' ? 'Required (AND)' : 
              relationType === 'OR' ? 'Alternative (OR)' : relationType,
          });
        }
      }

      return {
        targetCourse: {
          department: targetCourse.department,
          courseNumber: targetCourse.courseNumber,
          title: targetCourse.title ?? undefined,
        },
        paths: allPaths,
        maxDepth: maxDepthFound,
        totalPaths: allPaths.length,
      };
    }),
});
