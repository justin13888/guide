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

// Tree node structure for database insertion
export interface PrerequisiteNode {
  parentId: number | null;
  relationType: "AND" | "OR" | null;
  department: string | null;
  courseNumber: string | null;
  minGrade: number | null;
}

export interface PrerequisiteTree {
  nodes: PrerequisiteNode[];
  rootNodeId: number;
}

// Helper interface for nodes with temporary IDs (for tree building)
export interface PrerequisiteNodeWithTempId extends PrerequisiteNode {
  tempId: number;
}

/**
 * Step 3: Parse requirements
 * The requirements for each course are given as a string. We parse this string
 * into our data schema that fits the database structure.
 */
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

  // 1. Split into sections by requirement types
  const sections = description.split(/\.\s*(?=Prereq:|Antireq:|Coreq:)/);

  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    // Split into type and content
    const colonIndex = trimmedSection.indexOf(":");
    if (colonIndex === -1) continue;

    const type = trimmedSection.substring(0, colonIndex).trim();
    const content = trimmedSection.substring(colonIndex + 1).trim();

    if (!content) continue;

    // 2. Parse restrictions (level, program, faculty)
    const sectionRestrictions = parseRestrictions(content);
    restrictions.push(...sectionRestrictions);

    // 3. Parse course requirements based on type
    if (type === "Prereq") {
      const prereqGroups = parsePrerequisites(content);
      groups.push(...prereqGroups);
    } else if (type === "Antireq") {
      const antireqGroup = parseSimpleRequirements(content, true, false);
      if (antireqGroup.requirements.length > 0) {
        groups.push(antireqGroup);
      }
    } else if (type === "Coreq") {
      const coreqGroup = parseSimpleRequirements(content, false, true);
      if (coreqGroup.requirements.length > 0) {
        groups.push(coreqGroup);
      }
    }
  }

  return { groups, restrictions };
}

/**
 * Parse restrictions (level, program, faculty requirements)
 */
function parseRestrictions(content: string): Array<{
  requirementType: RequirementType;
  value: string;
}> {
  const restrictions: Array<{
    requirementType: RequirementType;
    value: string;
  }> = [];

  // Parse level restrictions
  const levelMatch = content.match(/Level at least (\d[A-Z])/i);
  if (levelMatch) {
    restrictions.push({
      requirementType: "LEVEL",
      value: levelMatch[1]!,
    });
  }

  // Parse program restrictions
  const programMatch = content.match(/([A-Za-z\s]+) students only/i);
  if (programMatch && programMatch[1]) {
    restrictions.push({
      requirementType: "PROGRAM",
      value: programMatch[1].trim(),
    });
  }

  // Parse faculty restrictions
  const facultyMatch = content.match(/([A-Za-z\s]+) Faculty students only/i);
  if (facultyMatch && facultyMatch[1]) {
    restrictions.push({
      requirementType: "FACULTY",
      value: facultyMatch[1].trim(),
    });
  }

  return restrictions;
}

/**
 * Parse simple requirements (antireq, coreq) - these are straightforward course lists
 */
function parseSimpleRequirements(
  content: string,
  isAntireq: boolean,
  isCoreq: boolean,
): {
  outerRelationType: "AND" | "OR";
  requirements: Array<{
    relatedDepartment: string;
    relatedCourseNumber: string;
    innerRelationType: "AND" | "OR";
    minGrade: number | null;
    isAntireq: boolean;
    isCoreq: boolean;
  }>;
} {
  const courses = parseCourseList(content);
  return {
    outerRelationType: "AND", // Simple requirements are always AND
    requirements: courses.map((course) => ({
      relatedDepartment: course.department,
      relatedCourseNumber: course.courseNumber,
      innerRelationType: "AND",
      minGrade: course.minGrade,
      isAntireq,
      isCoreq,
    })),
  };
}

/**
 * Parse complex prerequisites with logical operators and parentheses
 */
export function parsePrerequisites(content: string): Array<{
  outerRelationType: "AND" | "OR";
  requirements: Array<{
    relatedDepartment: string;
    relatedCourseNumber: string;
    innerRelationType: "AND" | "OR";
    minGrade: number | null;
    isAntireq: boolean;
    isCoreq: boolean;
  }>;
}> {
  // Remove restrictions from content for course parsing
  const courseContent = content
    .replace(/Level at least \d[A-Z]/gi, "")
    .replace(/[A-Za-z\s]+ students only/gi, "")
    .replace(/[A-Za-z\s]+ Faculty students only/gi, "")
    .trim();

  if (!courseContent) return [];

  // Split by semicolons to handle multiple groups
  const semicolonGroups = courseContent.split(";").map((s) => s.trim());

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

  for (const group of semicolonGroups) {
    if (!group) continue;

    const groupRequirements = parsePrerequisiteGroup(group);
    if (groupRequirements.length > 0) {
      groups.push({
        outerRelationType: "AND",
        requirements: groupRequirements,
      });
    }
  }

  return groups;
}

/**
 * Parse a single prerequisite group (handles parentheses, "One of", etc.)
 */
function parsePrerequisiteGroup(content: string): Array<{
  relatedDepartment: string;
  relatedCourseNumber: string;
  innerRelationType: "AND" | "OR";
  minGrade: number | null;
  isAntireq: boolean;
  isCoreq: boolean;
}> {
  const requirements: Array<{
    relatedDepartment: string;
    relatedCourseNumber: string;
    innerRelationType: "AND" | "OR";
    minGrade: number | null;
    isAntireq: boolean;
    isCoreq: boolean;
  }> = [];

  // Handle parenthesized expressions
  if (content.includes("(") && content.includes(")")) {
    // Extract all parenthesized groups
    const parenthesesRegex = /\(([^)]+)\)/g;
    const matches = [...content.matchAll(parenthesesRegex)];

    for (const match of matches) {
      const groupContent = match[1]!;
      const groupRequirements = parseParenthesizedGroup(groupContent);
      requirements.push(...groupRequirements);
    }
  } else {
    // Handle "One of" expressions
    if (content.includes("One of")) {
      const oneOfMatch = content.match(/One of\s+(.+)/i);
      if (oneOfMatch) {
        const courses = parseCourseList(oneOfMatch[1]!);
        requirements.push(
          ...courses.map((course) => ({
            relatedDepartment: course.department,
            relatedCourseNumber: course.courseNumber,
            innerRelationType: "OR" as const,
            minGrade: course.minGrade,
            isAntireq: false,
            isCoreq: false,
          })),
        );
      }
    } else {
      // Handle simple course lists
      const courses = parseCourseList(content);
      const hasCommas = content.includes(",");
      const hasOr = content.includes(" or ");
      const relationType: "AND" | "OR" = hasCommas || hasOr ? "OR" : "AND";

      requirements.push(
        ...courses.map((course) => ({
          relatedDepartment: course.department,
          relatedCourseNumber: course.courseNumber,
          innerRelationType: relationType,
          minGrade: course.minGrade,
          isAntireq: false,
          isCoreq: false,
        })),
      );
    }
  }

  return requirements;
}

/**
 * Parse a parenthesized group
 */
function parseParenthesizedGroup(content: string): Array<{
  relatedDepartment: string;
  relatedCourseNumber: string;
  innerRelationType: "AND" | "OR";
  minGrade: number | null;
  isAntireq: boolean;
  isCoreq: boolean;
}> {
  const requirements: Array<{
    relatedDepartment: string;
    relatedCourseNumber: string;
    innerRelationType: "AND" | "OR";
    minGrade: number | null;
    isAntireq: boolean;
    isCoreq: boolean;
  }> = [];

  // Handle "One of" within parentheses
  if (content.includes("One of")) {
    const oneOfMatch = content.match(/One of\s+(.+)/i);
    if (oneOfMatch) {
      const courses = parseCourseList(oneOfMatch[1]!);
      requirements.push(
        ...courses.map((course) => ({
          relatedDepartment: course.department,
          relatedCourseNumber: course.courseNumber,
          innerRelationType: "OR" as const,
          minGrade: course.minGrade,
          isAntireq: false,
          isCoreq: false,
        })),
      );
    }
  } else {
    // Regular course list within parentheses
    const courses = parseCourseList(content);
    const hasCommas = content.includes(",");
    const hasOr = content.includes(" or ");
    const relationType: "AND" | "OR" = hasCommas || hasOr ? "OR" : "AND";

    requirements.push(
      ...courses.map((course) => ({
        relatedDepartment: course.department,
        relatedCourseNumber: course.courseNumber,
        innerRelationType: relationType,
        minGrade: course.minGrade,
        isAntireq: false,
        isCoreq: false,
      })),
    );
  }

  return requirements;
}

/**
 * Parse a list of courses from a string, handling various formats
 */
function parseCourseList(content: string): Array<{
  department: string;
  courseNumber: string;
  minGrade: number | null;
}> {
  const courses: Array<{
    department: string;
    courseNumber: string;
    minGrade: number | null;
  }> = [];

  // Handle course combinations like "MATH 118/119"
  const combinationRegex = /([A-Z]{2,4})\s+(\d{3}[A-Z]?)\/(\d{3}[A-Z]?)/g;
  let match: RegExpExecArray | null;

  while ((match = combinationRegex.exec(content)) !== null) {
    courses.push({
      department: match[1]!,
      courseNumber: match[2]!,
      minGrade: null,
    });
    courses.push({
      department: match[1]!,
      courseNumber: match[3]!,
      minGrade: null,
    });
  }

  // Handle individual courses with grade requirements
  const courseWithGradeRegex =
    /([A-Z]{2,4})\s+(\d{3}[A-Z]?)(?:\s+with\s+a\s+grade\s+of\s+at\s+least\s+(\d+)%)?/gi;

  while ((match = courseWithGradeRegex.exec(content)) !== null) {
    const minGrade = match[3] ? parseInt(match[3]!, 10) : null;
    courses.push({
      department: match[1]!,
      courseNumber: match[2]!,
      minGrade,
    });
  }

  // Handle simple course patterns (fallback) - propagate department for numbers
  // Split by 'or' and ','
  const parts = content
    .split(/\s+or\s+|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  let lastDepartment: string | null = null;
  for (const part of parts) {
    // Course with department
    const courseMatch = part.match(/^([A-Z]{2,4})\s+(\d{3}[A-Z]?)$/);
    if (courseMatch) {
      lastDepartment = courseMatch[1]!;
      // Avoid duplicates
      if (
        !courses.some(
          (c) =>
            c.department === lastDepartment &&
            c.courseNumber === courseMatch[2]!,
        )
      ) {
        courses.push({
          department: lastDepartment,
          courseNumber: courseMatch[2]!,
          minGrade: null,
        });
      }
      continue;
    }
    // Course number only
    const numberMatch = part.match(/^(\d{3}[A-Z]?)$/);
    if (numberMatch && lastDepartment) {
      if (
        !courses.some(
          (c) =>
            c.department === lastDepartment &&
            c.courseNumber === numberMatch[1]!,
        )
      ) {
        courses.push({
          department: lastDepartment,
          courseNumber: numberMatch[1]!,
          minGrade: null,
        });
      }
    }
  }

  // Filter out any spurious entries where department is 'or' or not all caps
  return courses.filter((c) => /^[A-Z]{2,4}$/.test(c.department));
}

/**
 * Build prerequisite tree structure for database insertion
 * Creates a tree structure where each node can be either a logical operator (AND/OR)
 * or a course requirement
 */
export function buildPrerequisiteTree(
  requirements: Array<{
    relatedDepartment: string;
    relatedCourseNumber: string;
    innerRelationType: "AND" | "OR";
    minGrade: number | null;
    isAntireq: boolean;
    isCoreq: boolean;
  }>,
): PrerequisiteTree {
  if (requirements.length === 0) {
    return { nodes: [], rootNodeId: 0 };
  }

  const nodesWithTempIds: PrerequisiteNodeWithTempId[] = [];
  let nextTempId = 1;

  // If there's only one requirement, create a simple tree with just the course node
  if (requirements.length === 1) {
    const req = requirements[0]!;
    nodesWithTempIds.push({
      tempId: nextTempId++,
      parentId: null,
      relationType: null, // Leaf node - no relation type
      department: req.relatedDepartment,
      courseNumber: req.relatedCourseNumber,
      minGrade: req.minGrade,
    });

    // Convert to nodes without tempId for database insertion
    const nodes: PrerequisiteNode[] = nodesWithTempIds.map(
      ({ tempId, ...node }) => node,
    );
    return { nodes, rootNodeId: 1 };
  }

  // Group requirements by department to create the hierarchical structure
  const departmentGroups = new Map<string, typeof requirements>();

  for (const req of requirements) {
    if (!departmentGroups.has(req.relatedDepartment)) {
      departmentGroups.set(req.relatedDepartment, []);
    }
    departmentGroups.get(req.relatedDepartment)!.push(req);
  }

  // If we have multiple departments, create a hierarchical structure
  if (departmentGroups.size > 1) {
    // Create root AND node
    const rootTempId = nextTempId++;
    nodesWithTempIds.push({
      tempId: rootTempId,
      parentId: null,
      relationType: "AND", // Logical operator node
      department: null,
      courseNumber: null,
      minGrade: null,
    });

    // For each department group, create an OR node with its courses
    for (const [department, deptRequirements] of departmentGroups) {
      // Create OR node for this department
      const orTempId = nextTempId++;
      nodesWithTempIds.push({
        tempId: orTempId,
        parentId: rootTempId,
        relationType: "OR", // Logical operator node
        department: null,
        courseNumber: null,
        minGrade: null,
      });

      // Add all courses in this department as children of the OR node
      for (const req of deptRequirements) {
        nodesWithTempIds.push({
          tempId: nextTempId++,
          parentId: orTempId,
          relationType: null, // Leaf node - no relation type
          department: req.relatedDepartment,
          courseNumber: req.relatedCourseNumber,
          minGrade: req.minGrade,
        });
      }
    }

    // Convert to nodes without tempId for database insertion
    const nodes: PrerequisiteNode[] = nodesWithTempIds.map(
      ({ tempId, ...node }) => node,
    );
    return { nodes, rootNodeId: 1 };
  } else {
    // Single department - create simple structure based on the inner relation type
    const rootRelationType = requirements.every(
      (r) => r.innerRelationType === "AND",
    )
      ? "AND"
      : "OR";

    // Create root logical operator node
    const rootTempId = nextTempId++;
    nodesWithTempIds.push({
      tempId: rootTempId,
      parentId: null,
      relationType: rootRelationType, // Logical operator node
      department: null,
      courseNumber: null,
      minGrade: null,
    });

    // Add child nodes for each requirement (these are leaf nodes)
    requirements.forEach((req, index) => {
      nodesWithTempIds.push({
        tempId: nextTempId++,
        parentId: rootTempId,
        relationType: null, // Leaf node - no relation type
        department: req.relatedDepartment,
        courseNumber: req.relatedCourseNumber,
        minGrade: req.minGrade,
      });
    });

    // Convert to nodes without tempId for database insertion
    const nodes: PrerequisiteNode[] = nodesWithTempIds.map(
      ({ tempId, ...node }) => node,
    );
    return { nodes, rootNodeId: 1 };
  }
}
