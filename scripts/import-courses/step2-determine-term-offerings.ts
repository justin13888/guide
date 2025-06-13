import { env } from "../../src/env";
import {
  fetchCourseSchedules,
  TERM_MAPPING,
  type TermSeason,
  type CourseSchedule,
  type ApiCourse,
  ensureNonNull,
} from "./step1-fetch-course-data";

// Type to track course offerings
export type CourseOffering = {
  courseId: string;
  offerings: {
    fall: boolean;
    winter: boolean;
    spring: boolean;
  };
};

/**
 * Step 2: Determine term offerings
 * Calls the API with 3 term codes to get a list of courseIDs of the courses
 * that are offered every term. We then cross-reference with the courses from Step 1.
 */
export async function determineTermOfferings(): Promise<
  Map<string, CourseOffering>
> {
  const apiKey = env.UWATERLOO_OPENDATA_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured");
  }

  // Fetch course schedules for all terms to determine which courses are offered when
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

  return courseOfferings;
}

/**
 * Apply term offering information to a list of courses
 */
export function applyTermOfferings(
  courses: ApiCourse[],
  courseOfferings: Map<string, CourseOffering>,
): (ApiCourse & { fall: boolean; winter: boolean; spring: boolean })[] {
  return courses.map((course) => {
    const courseId = ensureNonNull(
      course.courseId,
      `${course.subjectCode}${course.catalogNumber}`,
    );
    const offering = courseOfferings.get(courseId.toLowerCase());
    return {
      ...course,
      fall: offering?.offerings.fall ?? false,
      winter: offering?.offerings.winter ?? false,
      spring: offering?.offerings.spring ?? false,
    };
  });
}

/**
 * Filter courses to only include undergraduate courses (1XX-4XX)
 */
export function filterUndergraduateCourses(
  courses: (ApiCourse & { fall: boolean; winter: boolean; spring: boolean })[],
): (ApiCourse & { fall: boolean; winter: boolean; spring: boolean })[] {
  return courses.filter((course) => {
    const courseNumber = parseInt(ensureNonNull(course.catalogNumber, "000"));
    return courseNumber >= 100 && courseNumber < 500;
  });
}

/**
 * Filter courses to only include those offered in at least one term
 */
export function filterOfferedCourses(
  courses: (ApiCourse & { fall: boolean; winter: boolean; spring: boolean })[],
): (ApiCourse & { fall: boolean; winter: boolean; spring: boolean })[] {
  return courses.filter(
    (course) => course.fall || course.winter || course.spring,
  );
}
