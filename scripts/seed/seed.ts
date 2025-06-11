import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import "dotenv/config";
import {
  courses,
  prerequisiteNodes,
  coursePrerequisites,
  courseProgramRestrictions,
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
  await db.delete(courses);

  console.log("✨ Cleanup completed");
}

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // Clean up existing data first
    await cleanup();

    // STAT 231 Course data
    const sampleCourses = [
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
        requirements:
          "MATH 118 or MATH 119 or MATH 128 or MATH 138 or MATH 148",
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
        requirements:
          "MATH 118 or MATH 119 or MATH 128 or MATH 138 or MATH 148",
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
        requirements:
          "MATH 118 or MATH 119 or MATH 128 or MATH 138 or MATH 148",
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

    // Insert courses
    console.log("Inserting courses...");
    await db.insert(courses).values(sampleCourses);

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

    // Add program restrictions
    const programRestrictions = [
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

    // Insert program restrictions
    console.log("Inserting program restrictions...");
    await db.insert(courseProgramRestrictions).values(programRestrictions);

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
