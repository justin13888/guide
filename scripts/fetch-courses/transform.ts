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

// Output types matching our database schema
type TransformedCourse = {
  // For courses table
  course: {
    courseId: string;
    department: string;
    courseNumber: string;
    title: string;
    description: string | null;
    requirements: string | null;
    units: number | null;
  };

  // For term_offered table
  termOffered: {
    department: string;
    courseNumber: string;
    fall: boolean;
    winter: boolean;
    spring: boolean;
  };

  // For course_requirement_groups table
  requirementGroups: Array<{
    department: string;
    courseNumber: string;
    outerRelationType: "AND" | "OR";
    requirements: Array<{
      relatedDepartment: string;
      relatedCourseNumber: string;
      innerRelationType: "AND" | "OR";
      minGrade: number | null;
      isAntireq: boolean;
      isCoreq: boolean;
    }>;
  }>;

  // For course_restrictions table
  restrictions: Array<{
    department: string;
    courseNumber: string;
    requirementType: "LEVEL" | "PROGRAM" | "FACULTY";
    value: string;
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

  return {
    course: {
      courseId,
      department: subjectCode,
      courseNumber: catalogNumber,
      title,
      description: description || null,
      requirements: requirementsDescription || null,
      units: 0.5, // Can't get units info from API, default to 0.5
    },
    termOffered: {
      department: subjectCode,
      courseNumber: catalogNumber,
      ...termOfferings,
    },
    requirementGroups: groups.map((g) => ({
      ...g,
      department: subjectCode,
      courseNumber: catalogNumber,
    })),
    restrictions: restrictions.map((r) => ({
      ...r,
      department: subjectCode,
      courseNumber: catalogNumber,
    })),
  };
}

// Batch transformation function
export function transformCourseDataBatch(
  apiCourses: z.infer<typeof apiCourseSchema>[],
): TransformedCourse[] {
  return apiCourses.map(transformCourseData);
}
