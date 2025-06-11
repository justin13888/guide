import {
  parsePrerequisites,
  buildPrerequisiteTree,
} from "./step3-parse-requirements";

// Test the example from the README
const testString =
  "(One of MATH 118, 119, 128, 138, 148) and (STAT 220 with a grade of at least 70% or STAT 230 or 240)";

console.log("Testing prerequisite parsing:");
console.log("Input:", testString);
console.log();
const parsed = parsePrerequisites(testString);
console.log("Parsed requirements:", JSON.stringify(parsed, null, 2));
console.log();

// Test building the tree
if (parsed.length > 0 && parsed[0]!.requirements.length > 0) {
  const tree = buildPrerequisiteTree(parsed[0]!.requirements);
  console.log("Built tree:", JSON.stringify(tree, null, 2));

  // Print the tree structure in a readable format
  console.log("\nTree structure:");

  // Find the root node
  const rootNode = tree.nodes.find((node) => node.parentId === null);
  if (rootNode) {
    console.log(
      `Root (${rootNode.relationType}) - Will be assigned ID by database`,
    );
  }

  // Group by department for display
  const byDepartment = new Map<
    string,
    Array<{
      relatedDepartment: string;
      relatedCourseNumber: string;
      innerRelationType: "AND" | "OR";
      minGrade: number | null;
      isAntireq: boolean;
      isCoreq: boolean;
    }>
  >();

  for (const req of parsed[0]!.requirements) {
    if (!byDepartment.has(req.relatedDepartment)) {
      byDepartment.set(req.relatedDepartment, []);
    }
    byDepartment.get(req.relatedDepartment)!.push(req);
  }

  // Find the OR nodes in the tree for each department
  const orNodes = tree.nodes.filter((node) => node.relationType === "OR");
  let orNodeIndex = 0;

  for (const [dept, reqs] of byDepartment) {
    const orNode = orNodes[orNodeIndex];
    if (orNode) {
      console.log(
        `├── ${dept} subtree (${reqs[0]!.innerRelationType}) - Will be assigned ID by database`,
      );

      // Find the course nodes that are children of this OR node
      const courseNodes = tree.nodes.filter(
        (node) => node.parentId !== null && node.department === dept,
      );

      for (const courseNode of courseNodes) {
        const gradeInfo = courseNode.minGrade
          ? ` (minGrade: ${courseNode.minGrade})`
          : "";
        console.log(
          `│   ├── ${courseNode.department} ${courseNode.courseNumber}${gradeInfo} - Will be assigned ID by database`,
        );
      }
    }
    orNodeIndex++;
  }

  console.log(
    "\nNote: Node IDs will be assigned by the database when inserted.",
  );
  console.log(
    "Parent-child relationships are established via parentId references.",
  );
}
