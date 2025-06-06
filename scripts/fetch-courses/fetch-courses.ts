import "dotenv/config";
import { env } from "../../src/env";
import { z } from "zod";
import { transformCourseDataBatch } from "./transform";

// Term mapping for the current academic year
const TERM_MAPPING = {
  FALL: "1249", // Fall 2024
  WINTER: "1251", // Winter 2025
  SPRING: "1255", // Spring 2025
} as const;

type TermSeason = keyof typeof TERM_MAPPING;

const inputSchema = z.object({
  term: z.string().default("1249"), // default to Fall 2024
});

// Input type from API
const apiCourseSchema = z.object({
  courseId: z.string().nullable(),
  title: z.string().nullable(),
  subjectCode: z.string().nullable(),
  catalogNumber: z.string().nullable(),
  description: z.string().nullable(),
  requirementsDescription: z.string().nullable(),
});

// Type to track course offerings
type CourseOffering = {
  courseId: string;
  offerings: {
    fall: boolean;
    winter: boolean;
    spring: boolean;
  };
};

// Type for course schedule response
const courseScheduleSchema = z.object({
  courseId: z.string(),
  subjectCode: z.string(),
  catalogNumber: z.string(),
});

async function fetchCoursesForTerm(
  term: string,
  apiKey: string,
): Promise<z.infer<typeof apiCourseSchema>[]> {
  const response = await fetch(
    `https://openapi.data.uwaterloo.ca/v3/Courses/${term}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    },
  );

  const data = await response.json();
  const courses = z.array(apiCourseSchema).parse(data);

  return courses;
}

async function fetchCourseSchedules(
  term: string,
  apiKey: string,
): Promise<z.infer<typeof courseScheduleSchema>[]> {
  const response = await fetch(
    `https://openapi.data.uwaterloo.ca/v3/ClassSchedules/${term}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    },
  );

  const data = await response.json();

  // The API returns an array of course IDs (e.g. "000043")
  const schedules = z
    .array(z.string())
    .parse(data)
    .map((item) => ({
      courseId: item,
      subjectCode: "", // These will be populated when we match with the courses API
      catalogNumber: "",
    }));

  return schedules;
}

// Helper function to ensure non-null values
function ensureNonNull<T>(value: T | null, defaultValue: T): T {
  return value ?? defaultValue;
}

async function fetchCourses(input: z.infer<typeof inputSchema>) {
  const apiKey = env.UWATERLOO_OPENDATA_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured");
  }

  // First, fetch course schedules for all terms to determine which courses are offered when
  const termSchedules = await Promise.all(
    Object.entries(TERM_MAPPING).map(async ([season, term]) => {
      const schedules = await fetchCourseSchedules(term, apiKey);
      return { season: season as TermSeason, schedules };
    }),
  );

  // Create a map to track course offerings
  const courseOfferings = new Map<string, CourseOffering>();

  // Process schedules to determine which courses are offered in which terms
  termSchedules.forEach(({ season, schedules }) => {
    console.log(`\nProcessing ${season} term schedules...`);
    schedules.forEach((schedule) => {
      const courseId = schedule.courseId.toLowerCase();
      if (!courseOfferings.has(courseId)) {
        courseOfferings.set(courseId, {
          courseId,
          offerings: {
            fall: false,
            winter: false,
            spring: false,
          },
        });
      }
      const offering = courseOfferings.get(courseId)!;
      offering.offerings[
        season.toLowerCase() as keyof typeof offering.offerings
      ] = true;
    });
  });

  // Now fetch all courses for the specified term
  const courses = await fetchCoursesForTerm(input.term, apiKey);

  // Ensure non-null values for required fields
  const processedCourses = courses.map((course) => ({
    ...course,
    courseId: ensureNonNull(
      course.courseId,
      `${course.subjectCode}${course.catalogNumber}`,
    ),
    title: ensureNonNull(course.title, "Untitled Course"),
    subjectCode: ensureNonNull(course.subjectCode, "UNKNOWN"),
    catalogNumber: ensureNonNull(course.catalogNumber, "000"),
    description: ensureNonNull(course.description, ""),
    requirementsDescription: ensureNonNull(course.requirementsDescription, ""),
  }));

  // Transform the courses and add offering information from our schedule data
  const transformedData = transformCourseDataBatch(processedCourses).map(
    (course) => {
      const offering = courseOfferings.get(
        course.course.courseId.toLowerCase(),
      );
      return {
        ...course,
        termOffered: {
          ...course.termOffered,
          fall: offering?.offerings.fall ?? false,
          winter: offering?.offerings.winter ?? false,
          spring: offering?.offerings.spring ?? false,
        },
      };
    },
  );

  // Filter for undergrad courses (1XX-4XX)
  const undergradCourses = transformedData.filter((course) => {
    const courseNumber = parseInt(course.course.courseNumber);
    return courseNumber >= 100 && courseNumber < 500;
  });

  // Filter out courses that aren't offered in any term
  const offeredCourses = undergradCourses.filter(
    (course) =>
      course.termOffered.fall ||
      course.termOffered.winter ||
      course.termOffered.spring,
  );

  return offeredCourses;
}

// Parse command line arguments
const args = process.argv.slice(2);
const term =
  args.find((arg) => arg.startsWith("--term="))?.split("=")[1] ?? "1249";

const input = inputSchema.parse({ term });

// Execute the fetch
fetchCourses(input)
  .then((courses) => {
    console.log(JSON.stringify(courses, null, 2));
  })
  .catch((error) => {
    console.error("Error fetching courses:", error);
    process.exit(1);
  });
