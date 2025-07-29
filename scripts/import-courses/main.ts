import { fetchAllCourseData, TERM_MAPPING } from "./step1-fetch-course-data";
import {
  determineTermOfferings,
  applyTermOfferings,
} from "./step2-determine-term-offerings";
import {
  insertCourseDataBatch,
  clearExistingCourseData,
  getInsertionStats,
  transformCourseDataBatch,
  isDemoRun,
  ensureMasterUser,
} from "./step4-prepare-insert";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "~/server/db";

/**
 * Main script to import all courses from the API into the database
 * This orchestrates the entire process:
 * 1. Fetch course data from the API
 * 2. Determine term offerings
 * 3. Transform data to match database schemap
 * 4. Insert into database
 */

interface ImportOptions {
  clearExisting?: boolean;
  saveToFile?: boolean;
  debugOutput?: boolean; // New option for debug output
  batchSize?: number;
  maxCourses?: number; // For testing with a subset
}

export async function importCourses(
  options: ImportOptions = {},
): Promise<void> {
  const {
    clearExisting = false,
    saveToFile = false,
    debugOutput = true,
    batchSize = 50,
    maxCourses,
  } = options;

  console.log("🚀 Starting course import process...");

  try {
    // Step 1: Clear existing data if requested
    if (clearExisting) {
      await clearExistingCourseData();
    }

    // Step 1.5: Ensure master user exists (for foreign key constraints)
    await ensureMasterUser();

    // Step 2: Fetch course data from API (using Fall term as base)
    console.log("📡 Fetching course data from API...");
    const apiCourses = await fetchAllCourseData(TERM_MAPPING.FALL);
    console.log(`📊 Fetched ${apiCourses.length} courses from API`);

    // Step 3: Determine term offerings
    console.log("📅 Determining term offerings...");
    const courseOfferings = await determineTermOfferings();
    const coursesWithTerms = applyTermOfferings(apiCourses, courseOfferings);

    // Limit courses if maxCourses is specified (useful for testing)
    const coursesToProcess = maxCourses
      ? coursesWithTerms.slice(0, maxCourses)
      : coursesWithTerms;

    // Step 4: Transform data to match database schema
    console.log("🔄 Transforming course data...");
    const transformedCourses = transformCourseDataBatch(coursesToProcess);
    console.log(`✅ Transformed ${transformedCourses.length} courses`);

    // Step 5: Save to file if requested
    if (saveToFile) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const outputPath = path.join(__dirname, "transformed-courses.json");
      await fs.writeFile(
        outputPath,
        JSON.stringify(transformedCourses, null, 2),
      );
      console.log(`💾 Saved transformed data to ${outputPath}`);
    }

    // Step 6: Insert into database
    console.log("💾 Inserting courses into database...");
    const startTime = Date.now();
    const results = await insertCourseDataBatch(
      transformedCourses,
      batchSize,
      debugOutput,
    );
    const endTime = Date.now();

    // Step 7: Generate and display statistics
    const stats = getInsertionStats(results);
    const duration = (endTime - startTime) / 1000;

    console.log("\n📈 Import Statistics:");
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total courses processed: ${stats.total}`);
    console.log(`✅ Successful insertions: ${stats.successful}`);
    if (!isDemoRun) {
      console.log(`❌ Failed insertions: ${stats.failed}`);
    }
    console.log(`🌳 Prerequisite nodes created: ${stats.totalNodes}`);
    console.log(`🔒 Restrictions created: ${stats.totalRestrictions}`);

    if (stats.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      stats.errors.slice(0, 10).forEach((error) => console.log(`  - ${error}`));
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log("\n🎉 Course import process completed!");
  } catch (error) {
    console.error("💥 Error during course import:", error);
    throw error;
  } finally {
    // Close the database connection to allow the script to terminate
    console.log("🔌 Closing database connection...");
    await db.$client.end();
    console.log("✅ Database connection closed");
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  const options: ImportOptions = {
    clearExisting: args.includes("--clear"),
    saveToFile: args.includes("--save"),
    debugOutput: !args.includes("--no-debug"), // Default to true, disable with --no-debug
    batchSize: 50,
  };

  // Parse batch size
  const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="));
  if (batchSizeArg) {
    const size = parseInt(batchSizeArg.split("=")[1]!, 10);
    if (!isNaN(size) && size > 0) {
      options.batchSize = size;
    }
  }

  // Parse max courses (for testing)
  const maxCoursesArg = args.find((arg) => arg.startsWith("--max-courses="));
  if (maxCoursesArg) {
    const max = parseInt(maxCoursesArg.split("=")[1]!, 10);
    if (!isNaN(max) && max > 0) {
      options.maxCourses = max;
    }
  }

  // Show help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: pnpm run import-courses [options]

Options:
  --clear              Clear existing course data before import
  --save               Save transformed data to file
  --no-debug           Disable output of transformed data to JSON file (enabled by default)
  --batch-size=N       Set batch size for database insertion (default: 50)
  --max-courses=N      Limit number of courses to import (for testing)
  --help, -h           Show this help message

Examples:
  pnpm run import-courses                    # Import all courses (with debug output)
  pnpm run import-courses --clear            # Clear existing data and import all
  pnpm run import-courses --max-courses=10   # Import only 10 courses (for testing)
  pnpm run import-courses --batch-size=100   # Use larger batch size
  pnpm run import-courses --save             # Save final transformed data to file
  pnpm run import-courses --no-debug         # Disable debug output to JSON file
    `);
    return;
  }

  await importCourses(options);
}

// Run if called directly
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
