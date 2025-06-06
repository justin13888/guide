// scripts/fetch-courses/parse-requirements.ts
import type { z } from "zod";

export type RequirementType = "LEVEL" | "PROGRAM" | "FACULTY";

export interface ParsedRequirement {
  type: "PREREQ" | "ANTIREQ" | "COREQ";
  courses: Array<{
    department: string;
    courseNumber: string;
    minGrade?: number;
  }>;
  restrictions: Array<{
    type: RequirementType;
    value: string;
  }>;
}

export interface ParsedRequirements {
  groups: Array<{
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
  restrictions: Array<{
    requirementType: RequirementType;
    value: string;
  }>;
}

export function parseRequirementsDescription(
  description: string | null,
): ParsedRequirements {
  if (!description) {
    return { groups: [], restrictions: [] };
  }

  const restrictions: Array<{
    requirementType: RequirementType;
    value: string;
  }> = [];
  const groups: Array<{
    outerRelationType: "AND" | "OR";
    requirements: Array<{
      relatedDepartment: string;
      relatedCourseNumber: string;
      innerRelationType: "AND" | "OR";
      minGrade: number | null;
      isAntireq: boolean;
      isCoreq: boolean;
    }>;
  }> = [];

  // 1. Split into sections
  const sections = description.split(/\.\s*(?=Prereq:|Antireq:|Coreq:)/);
  // Example: ["Prereq: Level at least 2A", "Antireq: CS 240, CS 241", "Coreq: CS 245"]

  // 2. For each section:
  for (const section of sections) {
    // Split into type and content
    const [type, content] = section.split(":").map((s) => s.trim());
    // Example: type = "Prereq", content = "Level at least 2A"

    if (!content) continue;

    // 3. Parse level restrictions
    const levelMatch = content.match(/Level at least (\d[A-Z])/i);
    // Example: levelMatch[1] = "2A"
    if (levelMatch) {
      restrictions.push({
        requirementType: "LEVEL",
        value: levelMatch[1]!,
      });
    }

    // 4. Parse program restrictions
    const programMatch = content.match(/([A-Za-z\s]+) students only/i);
    // Example: programMatch[1] = "Computer Science"
    if (programMatch && programMatch[1]) {
      restrictions.push({
        requirementType: "PROGRAM",
        value: programMatch[1].trim(),
      });
    }

    // 5. Parse course requirements
    const courseRegex = /([A-Z]{2,4})\s+(\d{3}[A-Z]?)/g;
    // Example: matches "CS 240" -> department="CS", courseNumber="240"
    const courses: Array<{ department: string; courseNumber: string }> = [];
    let match;

    while ((match = courseRegex.exec(content)) !== null) {
      courses.push({
        department: match[1]!,
        courseNumber: match[2]!,
      });
    }

    if (courses.length > 0) {
      // 6. Determine AND/OR relationships
      const hasCommas = content.includes(","); // OR relationship
      const hasSemicolons = content.includes(";"); // OR relationship between groups

      groups.push({
        outerRelationType: hasSemicolons ? "OR" : "AND",
        requirements: courses.map((course) => ({
          relatedDepartment: course.department,
          relatedCourseNumber: course.courseNumber,
          innerRelationType: hasCommas ? "OR" : "AND",
          minGrade: null, // TODO: Parse minimum grades if present
          isAntireq: type === "Antireq",
          isCoreq: type === "Coreq",
        })),
      });
    }
  }

  return { groups, restrictions };
}
