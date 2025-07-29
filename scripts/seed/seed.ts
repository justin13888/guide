import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "dotenv/config";
import {
  courses,
  prerequisiteNodes,
  coursePrerequisites,
  courseProgramRestrictions,
  antirequisites,
  corequisites,
  users,
} from "../../src/server/db/schema";

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function cleanup() {
  console.log("🧹 Cleaning up existing data...");

  // Delete in order of foreign key dependencies
  await db.delete(coursePrerequisites);
  await db.delete(prerequisiteNodes);
  await db.delete(courseProgramRestrictions);
  await db.delete(antirequisites);
  await db.delete(corequisites);
  await db.delete(courses);

  console.log("✨ Cleanup completed");
}

async function seedMasterUser() {
  await db
    .insert(users)
    .values({
      id: "master",
      name: "Master User",
      email: "master@example.com",
    })
    .onConflictDoNothing();
}

// STAT 231 Course data and seeding
async function seedSTAT231() {
  console.log("📊 Seeding STAT 231...");

  const stat231Courses = [
    {
      department: "STAT",
      courseNumber: "231",
      title: "Statistics",
      description:
        "An introduction to statistical methods and their applications. Topics include probability, random variables, sampling distributions, estimation, hypothesis testing, and regression analysis.",
      requirements:
        "(One of MATH 118, MATH 119, MATH 128, MATH 138, MATH 148) and (STAT 220 with a grade of at least 70% or STAT 230 or STAT 240); Honours Math or Math/Phys students.",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    // Prerequisite courses
    {
      department: "STAT",
      courseNumber: "220",
      title: "Probability and Statistics",
      description:
        "Introduction to probability and statistics. Topics include probability, random variables, sampling distributions, estimation, and hypothesis testing.",
      requirements: "MATH 118 or MATH 119 or MATH 128 or MATH 138 or MATH 148",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "STAT",
      courseNumber: "230",
      title: "Probability",
      description:
        "Introduction to probability theory. Topics include probability spaces, random variables, expectation, variance, and common probability distributions.",
      requirements: "MATH 118 or MATH 119 or MATH 128 or MATH 138 or MATH 148",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "STAT",
      courseNumber: "240",
      title: "Statistics",
      description:
        "Introduction to statistical methods. Topics include sampling distributions, estimation, hypothesis testing, and regression analysis.",
      requirements: "MATH 118 or MATH 119 or MATH 128 or MATH 138 or MATH 148",
      units: 0.5,
      fall: false,
      winter: true,
      spring: false,
    },
    {
      department: "STAT",
      courseNumber: "221",
      title: "Applied Statistics",
      description: "Applied statistical methods and their applications.",
      requirements: "STAT 220",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "STAT",
      courseNumber: "241",
      title: "Applied Statistics II",
      description: "Advanced applied statistical methods.",
      requirements: "STAT 240",
      units: 0.5,
      fall: false,
      winter: true,
      spring: false,
    },
    {
      department: "MATH",
      courseNumber: "118",
      title: "Calculus 1",
      description:
        "Introduction to calculus. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "MATH",
      courseNumber: "119",
      title: "Calculus 1 (Advanced)",
      description:
        "Advanced introduction to calculus. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "MATH",
      courseNumber: "128",
      title: "Calculus 1 for Engineering",
      description:
        "Calculus for engineering students. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "MATH",
      courseNumber: "138",
      title: "Calculus 1 for Mathematics",
      description:
        "Calculus for mathematics students. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "MATH",
      courseNumber: "148",
      title: "Calculus 1 (Honours)",
      description:
        "Honours calculus. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
  ];

  // Insert STAT 231 and related courses
  await db.insert(courses).values(stat231Courses).onConflictDoNothing();

  // Create prerequisite tree for STAT 231
  // Structure: (MATH 118 OR MATH 119 OR MATH 128 OR MATH 138 OR MATH 148) AND (STAT 220 OR STAT 230 OR STAT 240)

  // Root node (AND)
  const rootNode = await db
    .insert(prerequisiteNodes)
    .values({
      relationType: "AND",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // First group: MATH courses (OR)
  const mathGroupNode = await db
    .insert(prerequisiteNodes)
    .values({
      parentId: rootNode[0]!.id,
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // Second group: STAT courses (OR)
  const statGroupNode = await db
    .insert(prerequisiteNodes)
    .values({
      parentId: rootNode[0]!.id,
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // Add MATH course nodes
  const mathCourses = [
    { department: "MATH", courseNumber: "118", minGrade: null },
    { department: "MATH", courseNumber: "119", minGrade: null },
    { department: "MATH", courseNumber: "128", minGrade: null },
    { department: "MATH", courseNumber: "138", minGrade: null },
    { department: "MATH", courseNumber: "148", minGrade: null },
  ];

  await db.insert(prerequisiteNodes).values(
    mathCourses.map((course) => ({
      parentId: mathGroupNode[0]!.id,
      relationType: null,
      department: course.department,
      courseNumber: course.courseNumber,
      minGrade: course.minGrade,
    })),
  );

  // Add STAT course nodes
  const statCourses = [
    { department: "STAT", courseNumber: "220", minGrade: 70 },
    { department: "STAT", courseNumber: "230", minGrade: null },
    { department: "STAT", courseNumber: "240", minGrade: null },
  ];

  await db.insert(prerequisiteNodes).values(
    statCourses.map((course) => ({
      parentId: statGroupNode[0]!.id,
      relationType: null,
      department: course.department,
      courseNumber: course.courseNumber,
      minGrade: course.minGrade,
    })),
  );

  // Link STAT 231 to its prerequisite tree
  await db.insert(coursePrerequisites).values({
    department: "STAT",
    courseNumber: "231",
    rootNodeId: rootNode[0]!.id,
  });

  // Add program restrictions for STAT 231
  const stat231ProgramRestrictions = [
    {
      department: "STAT",
      courseNumber: "231",
      program: "Honours Math",
      restrictionType: "INCLUDE" as const,
    },
    {
      department: "STAT",
      courseNumber: "231",
      program: "Math/Phys",
      restrictionType: "INCLUDE" as const,
    },
  ];

  await db.insert(courseProgramRestrictions).values(stat231ProgramRestrictions);

  // Add antirequisites for STAT 231
  const stat231Antirequisites = [
    {
      department: "STAT",
      courseNumber: "231",
      antirequisiteDepartment: "STAT",
      antirequisiteCourseNumber: "221",
    },
    {
      department: "STAT",
      courseNumber: "231",
      antirequisiteDepartment: "STAT",
      antirequisiteCourseNumber: "241",
    },
  ];

  await db.insert(antirequisites).values(stat231Antirequisites);

  console.log("✅ STAT 231 seeded successfully!");
}

// CS 341 Course data and seeding
async function seedCS341() {
  console.log("💻 Seeding CS 341...");

  const cs341Courses = [
    {
      department: "CS",
      courseNumber: "341",
      title: "Algorithms",
      description:
        "Design and analysis of algorithms. Topics include algorithm design techniques, complexity analysis, and fundamental algorithms for sorting, searching, and graph problems.",
      requirements:
        "CS 240/CS 240E, CS 241/CS 241E, CS 246/CS 246E, (CS 251/CS 251E or ECE 222); Honours Computer Science, Honours Data Science (BCS), BCFM, BSE students only.",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    // Prerequisite courses
    {
      department: "CS",
      courseNumber: "240",
      title: "Data Structures and Data Management",
      description:
        "Introduction to data structures and algorithms. Topics include arrays, linked lists, stacks, queues, trees, graphs, and basic algorithm analysis.",
      requirements: "CS 136 or CS 146",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CS",
      courseNumber: "240E",
      title: "Data Structures and Data Management (Enhanced)",
      description:
        "Enhanced version of CS 240 with additional topics and deeper analysis.",
      requirements: "CS 136 or CS 146",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "CS",
      courseNumber: "241",
      title: "Foundations of Sequential Programs",
      description:
        "Introduction to sequential programming concepts and software engineering principles.",
      requirements: "CS 240 or CS 240E",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CS",
      courseNumber: "241E",
      title: "Foundations of Sequential Programs (Enhanced)",
      description:
        "Enhanced version of CS 241 with additional topics and deeper analysis.",
      requirements: "CS 240 or CS 240E",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "CS",
      courseNumber: "246",
      title: "Object Oriented Programming",
      description:
        "Software design principles, abstraction techniques, and specification methods.",
      requirements: "CS 241 or CS 241E",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CS",
      courseNumber: "246E",
      title: "Object Oriented Programming (Enhanced)",
      description:
        "Enhanced version of CS 246 with additional topics and deeper analysis.",
      requirements: "CS 241 or CS 241E",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "CS",
      courseNumber: "251",
      title: "Computer Organization and Design",
      description:
        "Computer architecture, organization, and design principles.",
      requirements: "CS 241 or CS 241E",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CS",
      courseNumber: "251E",
      title: "Computer Organization and Design (Enhanced)",
      description:
        "Enhanced version of CS 251 with additional topics and deeper analysis.",
      requirements: "CS 241 or CS 241E",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "ECE",
      courseNumber: "222",
      title: "Digital Computers",
      description: "Digital computer architecture and organization principles.",
      requirements: "ECE 124",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    // Antirequisite courses
    {
      department: "CS",
      courseNumber: "231",
      title: "Introduction to Computer Science",
      description: "Introduction to computer science concepts and programming.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "ECE",
      courseNumber: "406",
      title: "Algorithms and Data Structures",
      description:
        "Advanced algorithms and data structures for electrical engineering.",
      requirements: "ECE 250",
      units: 0.5,
      fall: false,
      winter: true,
      spring: false,
    },
  ];

  // Insert CS 341 and related courses
  await db.insert(courses).values(cs341Courses).onConflictDoNothing();

  // Create prerequisite tree for CS 341
  // Structure: CS 240/CS 240E AND CS 241/CS 241E AND CS 246/CS 246E AND (CS 251/CS 251E OR ECE 222)

  // Root node (AND)
  const rootNode = await db
    .insert(prerequisiteNodes)
    .values({
      relationType: "AND",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // First group: CS 240/CS 240E (OR)
  const cs240GroupNode = await db
    .insert(prerequisiteNodes)
    .values({
      parentId: rootNode[0]!.id,
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // Second group: CS 241/CS 241E (OR)
  const cs241GroupNode = await db
    .insert(prerequisiteNodes)
    .values({
      parentId: rootNode[0]!.id,
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // Third group: CS 246/CS 246E (OR)
  const cs246GroupNode = await db
    .insert(prerequisiteNodes)
    .values({
      parentId: rootNode[0]!.id,
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // Fourth group: CS 251/CS 251E OR ECE 222 (OR)
  const cs251Ece222GroupNode = await db
    .insert(prerequisiteNodes)
    .values({
      parentId: rootNode[0]!.id,
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // Add CS 240/CS 240E nodes
  await db.insert(prerequisiteNodes).values([
    {
      parentId: cs240GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "240",
      minGrade: null,
    },
    {
      parentId: cs240GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "240E",
      minGrade: null,
    },
  ]);

  // Add CS 241/CS 241E nodes
  await db.insert(prerequisiteNodes).values([
    {
      parentId: cs241GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "241",
      minGrade: null,
    },
    {
      parentId: cs241GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "241E",
      minGrade: null,
    },
  ]);

  // Add CS 246/CS 246E nodes
  await db.insert(prerequisiteNodes).values([
    {
      parentId: cs246GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "246",
      minGrade: null,
    },
    {
      parentId: cs246GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "246E",
      minGrade: null,
    },
  ]);

  // Add CS 251/CS 251E OR ECE 222 nodes
  await db.insert(prerequisiteNodes).values([
    {
      parentId: cs251Ece222GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "251",
      minGrade: null,
    },
    {
      parentId: cs251Ece222GroupNode[0]!.id,
      relationType: null,
      department: "CS",
      courseNumber: "251E",
      minGrade: null,
    },
    {
      parentId: cs251Ece222GroupNode[0]!.id,
      relationType: null,
      department: "ECE",
      courseNumber: "222",
      minGrade: null,
    },
  ]);

  // Link CS 341 to its prerequisite tree
  await db.insert(coursePrerequisites).values({
    department: "CS",
    courseNumber: "341",
    rootNodeId: rootNode[0]!.id,
  });

  // Add program restrictions for CS 341
  const cs341ProgramRestrictions = [
    {
      department: "CS",
      courseNumber: "341",
      program: "Honours Computer Science",
      restrictionType: "INCLUDE" as const,
    },
    {
      department: "CS",
      courseNumber: "341",
      program: "Honours Data Science (BCS)",
      restrictionType: "INCLUDE" as const,
    },
    {
      department: "CS",
      courseNumber: "341",
      program: "BCFM",
      restrictionType: "INCLUDE" as const,
    },
    {
      department: "CS",
      courseNumber: "341",
      program: "BSE",
      restrictionType: "INCLUDE" as const,
    },
  ];

  await db.insert(courseProgramRestrictions).values(cs341ProgramRestrictions);

  // Add antirequisites for CS 341
  const cs341Antirequisites = [
    {
      department: "CS",
      courseNumber: "341",
      antirequisiteDepartment: "CS",
      antirequisiteCourseNumber: "231",
    },
    {
      department: "CS",
      courseNumber: "341",
      antirequisiteDepartment: "ECE",
      antirequisiteCourseNumber: "406",
    },
  ];

  await db.insert(antirequisites).values(cs341Antirequisites);

  console.log("✅ CS 341 seeded successfully!");
}

// MATH 235 Course data and seeding
async function seedMATH235() {
  console.log("📐 Seeding MATH 235...");

  const math235Courses = [
    {
      department: "MATH",
      courseNumber: "235",
      title: "Linear Algebra 2 for Honours Mathematics",
      description:
        "Orthogonal and unitary matrices and transformations. Orthogonal projections, Gram-Schmidt procedure, best approximations, least-squares. Inner products, angles and orthogonality, orthogonal diagonalization, singular value decomposition, applications.",
      requirements:
        "(MATH 106 or MATH 114 or MATH 115 with a grade of at least 70%) or (MATH 136 with a grade of at least 60%) or MATH 146; Honours Mathematics or Mathematical Physics students.",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    // Prerequisite courses
    {
      department: "MATH",
      courseNumber: "106",
      title: "Pure Mathematics I (Advanced)",
      description: "Advanced topics in pure mathematics.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "MATH",
      courseNumber: "114",
      title: "Linear Algebra for Engineering",
      description: "Introduction to linear algebra for engineering students.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "MATH",
      courseNumber: "115",
      title: "Linear Algebra for Honours Mathematics",
      description:
        "Introduction to linear algebra for honours mathematics students.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "MATH",
      courseNumber: "136",
      title: "Linear Algebra 1",
      description:
        "Introduction to linear algebra. Topics include vectors, matrices, determinants, and systems of linear equations.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "MATH",
      courseNumber: "146",
      title: "Linear Algebra 1 (Honours)",
      description:
        "Honours linear algebra. Topics include vectors, matrices, determinants, and systems of linear equations.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    // Corequisite courses
    {
      department: "MATH",
      courseNumber: "128",
      title: "Calculus 1 for Engineering",
      description:
        "Calculus for engineering students. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "MATH",
      courseNumber: "138",
      title: "Calculus 1 for Mathematics",
      description:
        "Calculus for mathematics students. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "MATH",
      courseNumber: "148",
      title: "Calculus 1 (Honours)",
      description:
        "Honours calculus. Topics include limits, derivatives, and integrals.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    // Antirequisite courses
    {
      department: "MATH",
      courseNumber: "225",
      title: "Introduction to Linear Algebra",
      description: "Introduction to linear algebra concepts and applications.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "MATH",
      courseNumber: "245",
      title: "Linear Algebra for Statistics",
      description: "Linear algebra concepts for statistics students.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
  ];

  // Insert MATH 235 and related courses
  await db.insert(courses).values(math235Courses).onConflictDoNothing();

  // Create prerequisite tree for MATH 235
  // Structure: (MATH 106 OR MATH 114 OR (MATH 115 with grade 70)) OR (MATH 136 with grade 60) OR MATH 146

  // Root node (OR)
  const rootNode = await db
    .insert(prerequisiteNodes)
    .values({
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // First group: MATH 106 or MATH 114 or (MATH 115 with grade 70) (OR)
  const group1Node = await db
    .insert(prerequisiteNodes)
    .values({
      parentId: rootNode[0]!.id,
      relationType: "OR",
      department: null,
      courseNumber: null,
      minGrade: null,
    })
    .returning();

  // Second group: MATH 136 with grade 60 (course node directly)
  // Third group: MATH 146 (course node directly)

  // Add nodes for the first group
  await db.insert(prerequisiteNodes).values([
    {
      parentId: group1Node[0]!.id,
      relationType: null,
      department: "MATH",
      courseNumber: "106",
      minGrade: null,
    },
    {
      parentId: group1Node[0]!.id,
      relationType: null,
      department: "MATH",
      courseNumber: "114",
      minGrade: null,
    },
    {
      parentId: group1Node[0]!.id,
      relationType: null,
      department: "MATH",
      courseNumber: "115",
      minGrade: 70,
    },
  ]);

  // Add node for MATH 136 with grade 60
  await db.insert(prerequisiteNodes).values({
    parentId: rootNode[0]!.id,
    relationType: null,
    department: "MATH",
    courseNumber: "136",
    minGrade: 60,
  });

  // Add node for MATH 146
  await db.insert(prerequisiteNodes).values({
    parentId: rootNode[0]!.id,
    relationType: null,
    department: "MATH",
    courseNumber: "146",
    minGrade: null,
  });

  // Link MATH 235 to its prerequisite tree
  await db.insert(coursePrerequisites).values({
    department: "MATH",
    courseNumber: "235",
    rootNodeId: rootNode[0]!.id,
  });

  // Add program restrictions for MATH 235
  const math235ProgramRestrictions = [
    {
      department: "MATH",
      courseNumber: "235",
      program: "Honours Mathematics",
      restrictionType: "INCLUDE" as const,
    },
    {
      department: "MATH",
      courseNumber: "235",
      program: "Mathematical Physics",
      restrictionType: "INCLUDE" as const,
    },
  ];

  await db.insert(courseProgramRestrictions).values(math235ProgramRestrictions);

  // Add corequisites for MATH 235
  const math235Corequisites = [
    {
      department: "MATH",
      courseNumber: "235",
      corequisiteDepartment: "MATH",
      corequisiteCourseNumber: "128",
    },
    {
      department: "MATH",
      courseNumber: "235",
      corequisiteDepartment: "MATH",
      corequisiteCourseNumber: "138",
    },
    {
      department: "MATH",
      courseNumber: "235",
      corequisiteDepartment: "MATH",
      corequisiteCourseNumber: "148",
    },
  ];

  await db.insert(corequisites).values(math235Corequisites);

  // Add antirequisites for MATH 235
  const math235Antirequisites = [
    {
      department: "MATH",
      courseNumber: "235",
      antirequisiteDepartment: "MATH",
      antirequisiteCourseNumber: "225",
    },
    {
      department: "MATH",
      courseNumber: "235",
      antirequisiteDepartment: "MATH",
      antirequisiteCourseNumber: "245",
    },
  ];

  await db.insert(antirequisites).values(math235Antirequisites);

  console.log("✅ MATH 235 seeded successfully!");
}

// CS 115 Course data and seeding
async function seedCS115() {
  console.log("💻 Seeding CS 115...");

  const cs115Courses = [
    {
      department: "CS",
      courseNumber: "115",
      title: "Introduction to Computer Science 1",
      description:
        "An introduction to the fundamentals of computer science through the application of elementary programming patterns in the functional style of programming. Function definition and application. Tracing via substitution. Design, testing, and documentation. Recursive data definitions. Lists and trees. Functional and data abstraction.",
      requirements: "No prerequisites",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    // Antirequisite courses
    {
      department: "BME",
      courseNumber: "121",
      title: "Introduction to Biomedical Engineering",
      description:
        "Introduction to the principles and applications of biomedical engineering.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "CS",
      courseNumber: "135",
      title: "Designing Functional Programs",
      description:
        "Introduction to the design and implementation of functional programs.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CS",
      courseNumber: "137",
      title: "Introduction to Computer Science",
      description: "Introduction to computer science and programming.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CS",
      courseNumber: "138",
      title: "Introduction to Computer Science",
      description:
        "Introduction to computer science and programming for non-CS majors.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CS",
      courseNumber: "145",
      title: "Principles of Computer Science",
      description: "Fundamental concepts of computer science.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "CHE",
      courseNumber: "121",
      title: "Introduction to Chemical Engineering",
      description:
        "Introduction to chemical engineering principles and applications.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "CIVE",
      courseNumber: "121",
      title: "Civil Engineering Concepts",
      description: "Introduction to civil engineering concepts and design.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "ECE",
      courseNumber: "150",
      title: "Fundamentals of Programming",
      description: "Introduction to programming concepts and techniques.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: true,
    },
    {
      department: "GENE",
      courseNumber: "121",
      title: "Introduction to Genetic Engineering",
      description:
        "Introduction to genetic engineering principles and applications.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "MTE",
      courseNumber: "121",
      title: "Introduction to Mechatronics Engineering",
      description:
        "Introduction to mechatronics engineering principles and applications.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "ME",
      courseNumber: "101",
      title: "Mechanical Engineering Design 1",
      description: "Introduction to mechanical engineering design principles.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "NE",
      courseNumber: "111",
      title: "Introduction to Nanotechnology Engineering",
      description:
        "Introduction to nanotechnology engineering principles and applications.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "MSE",
      courseNumber: "121",
      title: "Introduction to Materials Science and Engineering",
      description:
        "Introduction to materials science and engineering principles and applications.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
    {
      department: "PHYS",
      courseNumber: "139",
      title: "Physics for Engineering",
      description: "Introduction to physics concepts for engineering students.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: true,
      spring: false,
    },
    {
      department: "SYDE",
      courseNumber: "121",
      title: "Introduction to Systems Design Engineering",
      description:
        "Introduction to systems design engineering principles and applications.",
      requirements: "None",
      units: 0.5,
      fall: true,
      winter: false,
      spring: false,
    },
  ];

  await db.insert(courses).values(cs115Courses).onConflictDoNothing();

  // Add antirequisites for CS 115
  const cs115Antirequisites = [
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "BME",
      antirequisiteCourseNumber: "121",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "CS",
      antirequisiteCourseNumber: "135",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "CS",
      antirequisiteCourseNumber: "137",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "CS",
      antirequisiteCourseNumber: "138",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "CS",
      antirequisiteCourseNumber: "145",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "CHE",
      antirequisiteCourseNumber: "121",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "CIVE",
      antirequisiteCourseNumber: "121",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "ECE",
      antirequisiteCourseNumber: "150",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "GENE",
      antirequisiteCourseNumber: "121",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "MTE",
      antirequisiteCourseNumber: "121",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "ME",
      antirequisiteCourseNumber: "101",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "NE",
      antirequisiteCourseNumber: "111",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "MSE",
      antirequisiteCourseNumber: "121",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "PHYS",
      antirequisiteCourseNumber: "139",
    },
    {
      department: "CS",
      courseNumber: "115",
      antirequisiteDepartment: "SYDE",
      antirequisiteCourseNumber: "121",
    },
  ];

  await db.insert(antirequisites).values(cs115Antirequisites);

  console.log("✅ CS 115 seeded successfully!");
}

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // Clean up existing data first
    await cleanup();

    // Seed master user first
    await seedMasterUser();

    // Seed each course separately
    await seedSTAT231();
    await seedCS341();
    await seedMATH235();
    await seedCS115();

    console.log("✅ Database seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error("Failed to seed database:", error);
  process.exit(1);
});
