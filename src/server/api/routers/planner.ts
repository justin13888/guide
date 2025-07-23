import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { planSchema, type Plan, type PrerequisiteChainsResponse, type CourseTreeResponse, type CourseTreeNode } from "~/models";
import { courses, coursePrerequisites } from "~/server/db/schema";
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

  getPrerequisiteChains: publicProcedure // TODO: Change to protectedProcedure when there's time to fix
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

  // TODO: See if this replaces the getPrerequisiteChains
  getCourseTree: publicProcedure
    .input(z.object({
      department: z.string(),
      courseNumber: z.string(),
      maxDepth: z.number().default(10).optional()
    }))
    .query(async ({ ctx, input }): Promise<CourseTreeResponse> => {
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

      // DEBUG: Let's see what courses have prerequisites
      const allPrereqs = await ctx.db.query.coursePrerequisites.findMany({
        limit: 10,
      });
      console.log('DEBUG: Sample courses with prerequisites:', allPrereqs);

      // Get the root prerequisite node for this course
      const coursePrereq = await ctx.db.query.coursePrerequisites.findFirst({
        where: and(
          eq(coursePrerequisites.department, department),
          eq(coursePrerequisites.courseNumber, courseNumber)
        ),
      });

      console.log(`DEBUG: Found coursePrereq for ${department} ${courseNumber}:`, coursePrereq);

      if (!coursePrereq) {
        console.log(`DEBUG: No prerequisites found for ${department} ${courseNumber}`);
        return {
          targetCourse: {
            department: targetCourse.department,
            courseNumber: targetCourse.courseNumber,
            title: targetCourse.title ?? undefined,
          },
          tree: undefined,
          maxDepth: 0,
          totalNodes: 0,
          hasPrerequisites: false,
        };
      }

      // Use a simple recursive CTE to build the tree structure
      const treeQuery = sql`
        WITH RECURSIVE prereq_tree AS (
          -- Base case: Start from the root prerequisite node
          SELECT 
            pn.id,
            pn.parent_id,
            pn.relation_type,
            pn.department,
            pn.course_number,
            pn.min_grade,
            c.title,
            0 as depth
          FROM prerequisite_nodes pn
          LEFT JOIN courses c ON pn.department = c.department AND pn.course_number = c.course_number
          WHERE pn.id = ${coursePrereq.rootNodeId}

          UNION ALL

          -- Recursive case: Get all child nodes
          SELECT 
            child.id,
            child.parent_id,
            child.relation_type,
            child.department,
            child.course_number,
            child.min_grade,
            c.title,
            pt.depth + 1
          FROM prereq_tree pt
          JOIN prerequisite_nodes child ON child.parent_id = pt.id
          LEFT JOIN courses c ON child.department = c.department AND child.course_number = c.course_number
          WHERE pt.depth < ${maxDepth}
        )
        SELECT 
          id,
          parent_id,
          relation_type,
          department,
          course_number,
          min_grade,
          title,
          depth
        FROM prereq_tree
        ORDER BY depth, parent_id NULLS FIRST, id;
      `;

      const rawResults = await ctx.db.execute(treeQuery);

      console.log(`DEBUG: Tree query returned ${rawResults.length} rows for ${department} ${courseNumber}`);

      type RawResult = {
        id: number;
        parent_id: number | null;
        relation_type: 'AND' | 'OR' | null;
        department: string | null;
        course_number: string | null;
        min_grade: number | null;
        title: string | null;
        depth: number;
      };

      const allResults = rawResults as unknown as RawResult[];
      const nodeMap = new Map<number, CourseTreeNode>();
      let maxDepthFound = 0;
      let totalNodes = 0;

      // Build all nodes first
      for (const row of allResults) {
        const nodeId = row.id;
        const relationType = row.relation_type;
        const dept = row.department;
        const courseNum = row.course_number;
        const minGrade = row.min_grade;
        const title = row.title;
        const depth = row.depth;

        totalNodes++;
        maxDepthFound = Math.max(maxDepthFound, depth);

        const node: CourseTreeNode = {
          id: nodeId.toString(),
          department: dept ?? '',
          courseNumber: courseNum ?? '',
          title: title ?? undefined,
          relationType: relationType ?? undefined,
          minGrade: minGrade ?? undefined,
          children: [],
          depth,
          isLeaf: dept !== null && courseNum !== null,
        };

        nodeMap.set(nodeId, node);
      }

      // Build parent-child relationships
      let rootNode: CourseTreeNode | undefined;
      for (const row of allResults) {
        const nodeId = row.id;
        const parentId = row.parent_id;

        const currentNode = nodeMap.get(nodeId);
        if (!currentNode) continue;

        if (parentId === null) {
          rootNode = currentNode;
        } else {
          const parentNode = nodeMap.get(parentId);
          if (parentNode?.children) {
            parentNode.children.push(currentNode);
          }
        }
      }

      // Find course nodes and manually fetch their prerequisites one level at a time
      const coursesToProcess: Array<{
        department: string;
        courseNumber: string;
        nodeId: number;
        depth: number;
      }> = [];

      for (const row of allResults) {
        if (row.department && row.course_number && row.depth < maxDepth - 1) {
          coursesToProcess.push({
            department: row.department,
            courseNumber: row.course_number,
            nodeId: row.id,
            depth: row.depth
          });
        }
      }

      console.log('DEBUG: Processing course nodes for deeper prerequisites:', coursesToProcess);

      // For each course, check if it has prerequisites and add them
      for (const courseInfo of coursesToProcess) {
        const parentNode = nodeMap.get(courseInfo.nodeId);
        if (!parentNode) continue;

        try {
          // Check if this course has its own prerequisites
          const subCoursePrereq = await ctx.db.query.coursePrerequisites.findFirst({
            where: and(
              eq(coursePrerequisites.department, courseInfo.department),
              eq(coursePrerequisites.courseNumber, courseInfo.courseNumber)
            ),
          });

          if (subCoursePrereq) {
            console.log(`DEBUG: Found sub-prerequisites for ${courseInfo.department} ${courseInfo.courseNumber}`);

            // Get the prerequisite tree for this sub-course
            const subTreeQuery = sql`
              WITH RECURSIVE sub_prereq_tree AS (
                SELECT 
                  pn.id,
                  pn.parent_id,
                  pn.relation_type,
                  pn.department,
                  pn.course_number,
                  pn.min_grade,
                  c.title,
                  ${courseInfo.depth + 1} as depth
                FROM prerequisite_nodes pn
                LEFT JOIN courses c ON pn.department = c.department AND pn.course_number = c.course_number
                WHERE pn.id = ${subCoursePrereq.rootNodeId}

                UNION ALL

                SELECT 
                  child.id,
                  child.parent_id,
                  child.relation_type,
                  child.department,
                  child.course_number,
                  child.min_grade,
                  c.title,
                  spt.depth + 1
                FROM sub_prereq_tree spt
                JOIN prerequisite_nodes child ON child.parent_id = spt.id
                LEFT JOIN courses c ON child.department = c.department AND child.course_number = c.course_number
                WHERE spt.depth < ${maxDepth}
              )
              SELECT * FROM sub_prereq_tree ORDER BY depth, parent_id NULLS FIRST, id;
            `;

            const subResults = await ctx.db.execute(subTreeQuery);
            console.log(`DEBUG: Found ${subResults.length} sub-prerequisite nodes for ${courseInfo.department} ${courseInfo.courseNumber}`);

            // Create nodes for the sub-prerequisites
            const subNodeMap = new Map<number, CourseTreeNode>();
            for (const subRow of subResults) {
              const subData = subRow as RawResult;
              const subNodeId = subData.id;

              const subNode: CourseTreeNode = {
                id: `${courseInfo.nodeId}-${subNodeId}`,
                department: subData.department ?? '',
                courseNumber: subData.course_number ?? '',
                title: subData.title ?? undefined,
                relationType: subData.relation_type ?? undefined,
                minGrade: subData.min_grade ?? undefined,
                children: [],
                depth: subData.depth,
                isLeaf: subData.department !== null && subData.course_number !== null,
              };

              subNodeMap.set(subNodeId, subNode);
              totalNodes++;
              maxDepthFound = Math.max(maxDepthFound, subData.depth);
            }

            // Build parent-child relationships for sub-tree
            let subRootNode: CourseTreeNode | undefined;
            for (const subRow of subResults) {
              const subData = subRow as RawResult;
              const subNodeId = subData.id;
              const subParentId = subData.parent_id;

              const currentSubNode = subNodeMap.get(subNodeId);
              if (!currentSubNode) continue;

              if (subParentId === null) {
                subRootNode = currentSubNode;
              } else {
                const parentSubNode = subNodeMap.get(subParentId);
                if (parentSubNode?.children) {
                  parentSubNode.children.push(currentSubNode);
                }
              }
            }

            // Add the sub-tree root to the parent node
            if (subRootNode && parentNode.children) {
              parentNode.children.push(subRootNode);
            }
          }
        } catch (error) {
          console.error(`Error fetching prerequisites for ${courseInfo.department} ${courseInfo.courseNumber}:`, error);
        }
      }

      console.log(`DEBUG: Built tree with root:`, rootNode ? {
        id: rootNode.id,
        dept: rootNode.department,
        courseNum: rootNode.courseNumber,
        childrenCount: rootNode.children?.length ?? 0
      } : 'NO ROOT');

      const res = {
        targetCourse: {
          department: targetCourse.department,
          courseNumber: targetCourse.courseNumber,
          title: targetCourse.title ?? undefined,
        },
        tree: rootNode,
        maxDepth: maxDepthFound,
        totalNodes,
        hasPrerequisites: true,
      }; // TODO: Finalize this ^^

      console.log("DEBUG: response:", JSON.stringify(res, null, 2))

      return res;
    }),
});
