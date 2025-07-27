import { db } from "~/server/db";
import {
  courses,
  prerequisiteNodes,
  coursePrerequisites,
  courseProgramRestrictions,
  antirequisites,
  corequisites,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import {
  parseRequirementsDescription,
  buildPrerequisiteTree,
} from "./step3-parse-requirements";
import type { ApiCourse } from "./step1-fetch-course-data";
import { ensureNonNull } from "./step1-fetch-course-data";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Output types matching our database schema
export type TransformedCourse = {
  // For courses table
  course: {
    department: string;
    courseNumber: string;
    title: string;
    description: string | null;
    requirements: string | null;
    units: number | null;
    minLevel: string | null;
    fall: boolean;
    winter: boolean;
    spring: boolean;
  };

  // For prerequisiteNodes table (if prerequisites exist)
  prerequisiteNodes: Array<{
    parentId: number | null;
    relationType: "AND" | "OR" | null;
    department: string | null;
    courseNumber: string | null;
    minGrade: number | null;
  }>;

  // For coursePrerequisites table (if prerequisites exist)
  coursePrerequisites: {
    department: string;
    courseNumber: string;
    rootNodeId: number;
  } | null;

  // For courseProgramRestrictions table
  programRestrictions: Array<{
    department: string;
    courseNumber: string;
    program: string;
    minLevel: string | null;
    restrictionType: "INCLUDE" | "EXCLUDE";
  }>;

  // For antirequisites table
  antirequisites: Array<{
    department: string;
    courseNumber: string;
    antirequisiteDepartment: string;
    antirequisiteCourseNumber: string;
  }>;

  // For corequisites table
  corequisites: Array<{
    department: string;
    courseNumber: string;
    corequisiteDepartment: string;
    corequisiteCourseNumber: string;
  }>;
};

/**
 * Transform API course data into our database schema format
 */
export function transformCourseData(
  apiCourse: ApiCourse & { fall: boolean; winter: boolean; spring: boolean },
): TransformedCourse {
  const {
    courseId,
    subjectCode,
    catalogNumber,
    title,
    description,
    requirementsDescription,
    fall,
    winter,
    spring,
  } = apiCourse;

  // Ensure we have valid department and course number
  const department = ensureNonNull(subjectCode, "UNKNOWN");
  const courseNumber = ensureNonNull(catalogNumber, "000");

  // Parse requirements and restrictions
  const { groups, restrictions, programRestrictions, minLevel } =
    parseRequirementsDescription(requirementsDescription);

  // Build prerequisite tree if there are requirements
  let prerequisiteNodes: Array<{
    parentId: number | null;
    relationType: "AND" | "OR" | null;
    department: string | null;
    courseNumber: string | null;
    minGrade: number | null;
  }> = [];
  let coursePrerequisites: {
    department: string;
    courseNumber: string;
    rootNodeId: number;
  } | null = null;

  if (groups.length > 0 && groups[0]!.requirements.length > 0) {
    const { nodes, rootNodeId } = buildPrerequisiteTree(
      groups[0]!.requirements,
    );
    prerequisiteNodes = nodes;
    coursePrerequisites = {
      department,
      courseNumber,
      rootNodeId,
    };
  }

  // Process program restrictions from the parsed programRestrictions array
  const transformedProgramRestrictions = programRestrictions.map((pr) => ({
    department,
    courseNumber,
    program: pr.program,
    minLevel: pr.level,
    restrictionType: pr.restrictionType,
  }));

  // Process antirequisites from the groups array
  const transformedAntirequisites = groups.flatMap((group) =>
    group.requirements
      .filter((req) => req.isAntireq)
      .map((req) => ({
        department,
        courseNumber,
        antirequisiteDepartment: req.relatedDepartment,
        antirequisiteCourseNumber: req.relatedCourseNumber,
      })),
  );

  // Process corequisites from the groups array
  const transformedCorequisites = groups.flatMap((group) =>
    group.requirements
      .filter((req) => req.isCoreq)
      .map((req) => ({
        department,
        courseNumber,
        corequisiteDepartment: req.relatedDepartment,
        corequisiteCourseNumber: req.relatedCourseNumber,
      })),
  );

  return {
    course: {
      department,
      courseNumber,
      title: ensureNonNull(title, "Untitled Course"),
      description: description || null,
      requirements: requirementsDescription || null,
      units: 0.5, // Can't get units info from API, default to 0.5
      minLevel,
      fall,
      winter,
      spring,
    },
    prerequisiteNodes,
    coursePrerequisites,
    programRestrictions: transformedProgramRestrictions,
    antirequisites: transformedAntirequisites,
    corequisites: transformedCorequisites,
  };
}

// Batch transformation function
export function transformCourseDataBatch(
  apiCourses: (ApiCourse & {
    fall: boolean;
    winter: boolean;
    spring: boolean;
  })[],
): TransformedCourse[] {
  return apiCourses.map(transformCourseData);
}

/**
 * Insert transformed course data into the database
 * This script handles the insertion of courses, prerequisite trees, and restrictions
 */

export interface InsertionResult {
  success: boolean;
  courseId: string;
  error?: string;
  insertedNodes?: number;
  insertedRestrictions?: number;
}

// Global flag to control demo mode
// If true, errors will be suppressed
export let isDemoRun = true;

/**
 * Insert a single course with all its related data
 */
export async function insertCourseData(
  transformedCourse: TransformedCourse,
): Promise<InsertionResult> {
  const courseId = `${transformedCourse.course.department} ${transformedCourse.course.courseNumber}`;

  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // 1. Insert the course
      await tx
        .insert(courses)
        .values(transformedCourse.course)
        .onConflictDoUpdate({
          target: [courses.department, courses.courseNumber],
          set: {
            title: transformedCourse.course.title,
            description: transformedCourse.course.description,
            requirements: transformedCourse.course.requirements,
            units: transformedCourse.course.units,
            minLevel: transformedCourse.course.minLevel,
            fall: transformedCourse.course.fall,
            winter: transformedCourse.course.winter,
            spring: transformedCourse.course.spring,
          },
        });

      let insertedNodes = 0;
      let insertedRestrictions = 0;

      // 2. Insert prerequisite nodes if they exist
      if (transformedCourse.prerequisiteNodes.length > 0) {
        const nodeIds = await insertPrerequisiteNodes(
          tx,
          transformedCourse.prerequisiteNodes,
        );
        insertedNodes = nodeIds.length;

        // 3. Insert course prerequisites reference
        if (transformedCourse.coursePrerequisites) {
          await tx
            .insert(coursePrerequisites)
            .values({
              ...transformedCourse.coursePrerequisites,
              rootNodeId: nodeIds[0]!, // First node is the root
            })
            .onConflictDoUpdate({
              target: [
                coursePrerequisites.department,
                coursePrerequisites.courseNumber,
              ],
              set: {
                rootNodeId: nodeIds[0]!,
              },
            });
        }
      }

      // 4. Insert program restrictions
      if (transformedCourse.programRestrictions.length > 0) {
        await tx
          .insert(courseProgramRestrictions)
          .values(transformedCourse.programRestrictions);
        insertedRestrictions += transformedCourse.programRestrictions.length;
      }

      // 5. Insert antirequisites
      if (transformedCourse.antirequisites.length > 0) {
        await tx
          .insert(antirequisites)
          .values(transformedCourse.antirequisites)
          .onConflictDoNothing();
        insertedRestrictions += transformedCourse.antirequisites.length;
      }

      // 6. Insert corequisites
      if (transformedCourse.corequisites.length > 0) {
        await tx
          .insert(corequisites)
          .values(transformedCourse.corequisites)
          .onConflictDoNothing();
        insertedRestrictions += transformedCourse.corequisites.length;
      }

      return {
        success: true,
        courseId,
        insertedNodes,
        insertedRestrictions,
      };
    });
  } catch (error) {
    if (!isDemoRun) {
      console.error(`Error inserting course ${courseId}:`, error);
    }
    return {
      success: false,
      courseId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Insert prerequisite nodes and return their IDs
 * This handles the complex tree structure with proper parent-child relationships
 */
async function insertPrerequisiteNodes(
  tx: any,
  nodes: TransformedCourse["prerequisiteNodes"],
): Promise<number[]> {
  const nodeIds: number[] = [];
  const tempIdToRealId = new Map<number, number>();

  // First pass: insert all nodes and collect their real IDs
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const tempId = i + 1; // Temporary ID based on array index

    // Insert the node
    const [insertedNode] = await tx
      .insert(prerequisiteNodes)
      .values({
        parentId: null, // We'll update this in the second pass
        relationType: node.relationType,
        department: node.department,
        courseNumber: node.courseNumber,
        minGrade: node.minGrade,
      })
      .returning({ id: prerequisiteNodes.id });

    const realId = insertedNode.id;
    nodeIds.push(realId);
    tempIdToRealId.set(tempId, realId);
  }

  // Second pass: update parent IDs with real IDs
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const tempId = i + 1;
    const realId = tempIdToRealId.get(tempId)!;

    if (node.parentId !== null) {
      const realParentId = tempIdToRealId.get(node.parentId);
      if (realParentId) {
        await tx
          .update(prerequisiteNodes)
          .set({ parentId: realParentId })
          .where(eq(prerequisiteNodes.id, realId));
      }
    }
  }

  return nodeIds;
}

/**
 * Write transformed course data to a JSON file for debugging
 */
export function writeTransformedCoursesToFile(
  transformedCourses: TransformedCourse[],
  filename: string = "transformed-courses.json",
): void {
  // Get the directory where this script is located
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outputPath = join(__dirname, filename);

  try {
    const outputData = {
      timestamp: new Date().toISOString(),
      totalCourses: transformedCourses.length,
      courses: transformedCourses,
    };

    writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf-8");
    console.log(`✅ Transformed course data written to: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error writing to ${outputPath}:`, error);
  }
}

/**
 * Insert multiple courses in batch
 */
export async function insertCourseDataBatch(
  transformedCourses: TransformedCourse[],
  batchSize: number = 50,
  debugOutput: boolean = true,
): Promise<InsertionResult[]> {
  // Output to JSON file by default (for debugging purposes)
  writeTransformedCoursesToFile(transformedCourses);

  const results: InsertionResult[] = [];

  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < transformedCourses.length; i += batchSize) {
    const batch = transformedCourses.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedCourses.length / batchSize)}`,
    );

    const batchPromises = batch.map((course) => insertCourseData(course));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to be nice to the database
    if (i + batchSize < transformedCourses.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Clear existing course data (useful for fresh imports)
 */
export async function clearExistingCourseData(): Promise<void> {
  console.log("Clearing existing course data...");

  await db.transaction(async (tx) => {
    // Delete in order to respect foreign key constraints
    await tx.delete(coursePrerequisites);
    await tx.delete(prerequisiteNodes);
    await tx.delete(courseProgramRestrictions);
    await tx.delete(antirequisites);
    await tx.delete(corequisites);
    await tx.delete(courses);
  });

  console.log("Existing course data cleared successfully");
}

/**
 * Get insertion statistics
 */
export function getInsertionStats(results: InsertionResult[]): {
  total: number;
  successful: number;
  failed: number;
  totalNodes: number;
  totalRestrictions: number;
  errors: string[];
} {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    totalNodes: successful.reduce((sum, r) => sum + (r.insertedNodes || 0), 0),
    totalRestrictions: successful.reduce(
      (sum, r) => sum + (r.insertedRestrictions || 0),
      0,
    ),
    errors: isDemoRun ? [] : failed.map((r) => `${r.courseId}: ${r.error}`),
  };
}
