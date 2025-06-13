import "dotenv/config";
import { env } from "../../src/env";
import { z } from "zod";

// Input type from API
const apiCourseSchema = z.object({
  courseId: z.string().nullable(),
  title: z.string().nullable(),
  subjectCode: z.string().nullable(),
  catalogNumber: z.string().nullable(),
  description: z.string().nullable(),
  requirementsDescription: z.string().nullable(),
});

// Type for course schedule response
const courseScheduleSchema = z.object({
  courseId: z.string(),
  subjectCode: z.string(),
  catalogNumber: z.string(),
});

export type ApiCourse = z.infer<typeof apiCourseSchema>;
export type CourseSchedule = z.infer<typeof courseScheduleSchema>;

// Term mapping for the current academic year
export const TERM_MAPPING = {
  FALL: "1249", // Fall 2024
  WINTER: "1251", // Winter 2025
  SPRING: "1255", // Spring 2025
} as const;

export type TermSeason = keyof typeof TERM_MAPPING;

/**
 * Step 1: Fetch course data from UW OpenData API
 * Calls the API route to get data about each course
 */
export async function fetchCoursesForTerm(
  term: string,
  apiKey: string,
): Promise<ApiCourse[]> {
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

/**
 * Fetch course schedules for a specific term
 * Used to determine which courses are offered in which terms
 */
export async function fetchCourseSchedules(
  term: string,
  apiKey: string,
): Promise<CourseSchedule[]> {
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
export function ensureNonNull<T>(value: T | null, defaultValue: T): T {
  return value ?? defaultValue;
}

/**
 * Main function to fetch all course data for a given term
 */
export async function fetchAllCourseData(term: string): Promise<ApiCourse[]> {
  const apiKey = env.UWATERLOO_OPENDATA_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured");
  }

  const courses = await fetchCoursesForTerm(term, apiKey);

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

  return processedCourses;
}
