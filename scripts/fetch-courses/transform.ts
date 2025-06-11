import { z } from "zod";
import { parseRequirementsDescription } from "./parse-requirements";

// Input type from API
const apiCourseSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  subjectCode: z.string(),
  catalogNumber: z.string(),
  description: z.string(),
  requirementsDescription: z.string(),
  // Add other fields once we see complete API response
});

// Output types matching our new database schema
type TransformedCourse = {
  // For courses table
  course: {
    department: string;
    courseNumber: string;
    title: string;
    description: string | null;
    requirements: string | null;
    units: number | null;
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
    restrictionType: "INCLUDE" | "EXCLUDE";
  }>;

  // For courseLevelRequirements table
  levelRequirements: Array<{
    department: string;
    courseNumber: string;
    level: string;
  }>;
};

// Helper function to determine term offerings
function determineTermOfferings(courseId: string): {
  fall: boolean;
  winter: boolean;
  spring: boolean;
} {
  // TODO: Implement term offering logic
  // This might need to come from a separate API call or be parsed from courseId
  return {
    fall: false,
    winter: false,
    spring: false,
  };
}

// Helper function to build prerequisite tree
function buildPrerequisiteTree(
  requirements: Array<{
    relatedDepartment: string;
    relatedCourseNumber: string;
    innerRelationType: "AND" | "OR";
    minGrade: number | null;
    isAntireq: boolean;
    isCoreq: boolean;
  }>,
): {
  nodes: Array<{
    parentId: number | null;
    relationType: "AND" | "OR" | null;
    department: string | null;
    courseNumber: string | null;
    minGrade: number | null;
  }>;
  rootNodeId: number;
} {
  if (requirements.length === 0) {
    return { nodes: [], rootNodeId: 0 };
  }

  const nodes: Array<{
    parentId: number | null;
    relationType: "AND" | "OR" | null;
    department: string | null;
    courseNumber: string | null;
    minGrade: number | null;
  }> = [];

  // If there's only one requirement, create a simple tree
  if (requirements.length === 1) {
    const req = requirements[0]!;
    nodes.push({
      parentId: null,
      relationType: null,
      department: req.relatedDepartment,
      courseNumber: req.relatedCourseNumber,
      minGrade: req.minGrade,
    });
    return { nodes, rootNodeId: 1 };
  }

  // For multiple requirements, create a tree structure
  // First, create the root node with the relation type
  const rootRelationType = requirements.every(
    (r) => r.innerRelationType === "AND",
  )
    ? "AND"
    : "OR";

  nodes.push({
    parentId: null,
    relationType: rootRelationType,
    department: null,
    courseNumber: null,
    minGrade: null,
  });

  const rootNodeId = 1;

  // Add child nodes for each requirement
  requirements.forEach((req, index) => {
    nodes.push({
      parentId: rootNodeId,
      relationType: null,
      department: req.relatedDepartment,
      courseNumber: req.relatedCourseNumber,
      minGrade: req.minGrade,
    });
  });

  return { nodes, rootNodeId };
}

// Main transformation function
export function transformCourseData(
  apiCourse: z.infer<typeof apiCourseSchema>,
): TransformedCourse {
  const {
    courseId,
    subjectCode,
    catalogNumber,
    title,
    description,
    requirementsDescription,
  } = apiCourse;

  // Parse requirements and restrictions
  const { groups, restrictions } = parseRequirementsDescription(
    requirementsDescription,
  );

  // Determine term offerings
  const termOfferings = determineTermOfferings(courseId);

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
      department: subjectCode,
      courseNumber: catalogNumber,
      rootNodeId,
    };
  }

  // Process restrictions
  const programRestrictions = restrictions
    .filter((r) => r.requirementType === "PROGRAM")
    .map((r) => ({
      department: subjectCode,
      courseNumber: catalogNumber,
      program: r.value,
      restrictionType: "INCLUDE" as const, // Default to INCLUDE for program restrictions
    }));

  const levelRequirements = restrictions
    .filter((r) => r.requirementType === "LEVEL")
    .map((r) => ({
      department: subjectCode,
      courseNumber: catalogNumber,
      level: r.value,
    }));

  return {
    course: {
      department: subjectCode,
      courseNumber: catalogNumber,
      title,
      description: description || null,
      requirements: requirementsDescription || null,
      units: 0.5, // Can't get units info from API, default to 0.5
      ...termOfferings,
    },
    prerequisiteNodes,
    coursePrerequisites,
    programRestrictions,
    levelRequirements,
  };
}

// Batch transformation function
export function transformCourseDataBatch(
  apiCourses: z.infer<typeof apiCourseSchema>[],
): TransformedCourse[] {
  return apiCourses.map(transformCourseData);
}
