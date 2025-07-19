import { db } from "~/server/db";
import {
  courses,
  prerequisiteNodes,
  coursePrerequisites,
  courseProgramRestrictions,
} from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
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

/**
 * Insert a single course with all its related data using transactions
 */
export async function insertCourseData(
  transformedCourse: TransformedCourse,
): Promise<InsertionResult> {
  const courseId = `${transformedCourse.course.department} ${transformedCourse.course.courseNumber}`;

  try {
    // Start transaction
    await db.execute(sql`BEGIN`);

    // Call the PostgreSQL function within the transaction
    await db.execute(sql`
      SELECT insert_course_with_prerequisites(
        ${transformedCourse.course.department},
        ${transformedCourse.course.courseNumber},
        ${transformedCourse.course.title},
        ${transformedCourse.course.description},
        ${transformedCourse.course.requirements},
        ${transformedCourse.course.units},
        ${transformedCourse.course.minLevel},
        ${transformedCourse.course.fall},
        ${transformedCourse.course.winter},
        ${transformedCourse.course.spring},
        ${JSON.stringify(transformedCourse.prerequisiteNodes)}::jsonb,
        ${JSON.stringify(transformedCourse.programRestrictions)}::jsonb
      );
    `);

    // Commit transaction
    await db.execute(sql`COMMIT`);

    return {
      success: true,
      courseId,
      insertedNodes: transformedCourse.prerequisiteNodes.length,
      insertedRestrictions: transformedCourse.programRestrictions.length,
    };
  } catch (error) {
    // Rollback transaction on error
    await db.execute(sql`ROLLBACK`);
    console.error(`Error inserting course ${courseId}:`, error);
    return {
      success: false,
      courseId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Set up the PostgreSQL function for course insertion
 * This needs to be run once before using insertCourseData
 */
export async function setupCourseInsertFunction(): Promise<void> {
  console.log("Setting up PostgreSQL function...");

  try {
    // Define the SQL function inline
    const functionSQL = `
CREATE OR REPLACE FUNCTION insert_course_with_prerequisites(
  p_department TEXT,
  p_course_number TEXT,
  p_title TEXT,
  p_description TEXT,
  p_requirements TEXT,
  p_units NUMERIC,
  p_min_level TEXT,
  p_fall BOOLEAN,
  p_winter BOOLEAN,
  p_spring BOOLEAN,
  p_prerequisite_nodes JSONB,
  p_program_restrictions JSONB
) RETURNS VOID AS $$
DECLARE
  root_node_id INTEGER;
  node_data JSONB;
BEGIN
  -- Insert or update the course
  INSERT INTO courses (
    department, course_number, title, description, requirements, units, min_level, fall, winter, spring
  ) VALUES (
    p_department, p_course_number, p_title, p_description, p_requirements, p_units, p_min_level, p_fall, p_winter, p_spring
  )
  ON CONFLICT (department, course_number) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    requirements = EXCLUDED.requirements,
    units = EXCLUDED.units,
    min_level = EXCLUDED.min_level,
    fall = EXCLUDED.fall,
    winter = EXCLUDED.winter,
    spring = EXCLUDED.spring;

  -- Insert prerequisite nodes if they exist
  IF p_prerequisite_nodes IS NOT NULL AND jsonb_array_length(p_prerequisite_nodes) > 0 THEN
    -- Insert prerequisite nodes and get the first one's ID as root
    WITH inserted_nodes AS (
      INSERT INTO prerequisite_nodes (parent_id, relation_type, department, course_number, min_grade)
      SELECT 
        NULL,
        (value->>'relationType')::relation_type,
        value->>'department',
        value->>'courseNumber',
        (value->>'minGrade')::INTEGER
      FROM jsonb_array_elements(p_prerequisite_nodes)
      RETURNING id, department, course_number
    )
    SELECT id INTO root_node_id FROM inserted_nodes LIMIT 1;
    
    -- Insert course prerequisites reference
    INSERT INTO course_prerequisites (department, course_number, root_node_id)
    VALUES (p_department, p_course_number, root_node_id)
    ON CONFLICT (department, course_number) DO UPDATE SET
      root_node_id = EXCLUDED.root_node_id;
  END IF;

  -- Insert program restrictions if they exist
  IF p_program_restrictions IS NOT NULL AND jsonb_array_length(p_program_restrictions) > 0 THEN
    INSERT INTO course_program_restrictions (department, course_number, program, min_level, restriction_type)
    SELECT 
      p_department,
      p_course_number,
      value->>'program',
      value->>'minLevel',
      (value->>'restrictionType')::restriction_type
    FROM jsonb_array_elements(p_program_restrictions);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in insert_course_with_prerequisites: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
    `;

    // Execute the function creation
    await db.execute(sql.raw(functionSQL));
    console.log("✅ PostgreSQL function created successfully");
  } catch (error) {
    console.error("❌ Error setting up PostgreSQL function:", error);
    throw error;
  }
}

// Refactored: Insert prerequisite nodes and return their IDs using raw SQL
async function insertPrerequisiteNodesSQL(
  db: any,
  nodes: TransformedCourse["prerequisiteNodes"],
): Promise<number[]> {
  const nodeIds: number[] = [];
  const tempIdToRealId = new Map<number, number>();

  // First pass: insert all nodes and collect their real IDs
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const tempId = i + 1; // Temporary ID based on array index

    // Insert the node
    const result = await db.execute(sql`
      INSERT INTO prerequisite_nodes (
        parent_id, relation_type, department, course_number, min_grade
      ) VALUES (
        NULL, ${node.relationType}, ${node.department}, ${node.courseNumber}, ${node.minGrade}
      )
      RETURNING id
    `);
    // Drizzle returns rows as array of objects
    const realId = result[0].id;
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
        await db.execute(sql`
          UPDATE prerequisite_nodes
          SET parent_id = ${realParentId}
          WHERE id = ${realId}
        `);
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

  try {
    // Start a transaction using raw SQL
    await db.execute(sql`BEGIN TRANSACTION`);

    // Delete in order to respect foreign key constraints
    await db.execute(sql`DELETE FROM course_prerequisites`);
    await db.execute(sql`DELETE FROM prerequisite_nodes`);
    await db.execute(sql`DELETE FROM course_program_restrictions`);
    await db.execute(sql`DELETE FROM courses`);

    // Commit the transaction
    await db.execute(sql`COMMIT`);
    console.log("Existing course data cleared successfully");
  } catch (error) {
    // Rollback the transaction on error
    await db.execute(sql`ROLLBACK`);
    console.error("Error clearing existing course data:", error);
    throw error;
  }
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
    errors: failed.map((r) => `${r.courseId}: ${r.error}`),
  };
}
