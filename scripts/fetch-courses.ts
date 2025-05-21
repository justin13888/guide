import "dotenv/config";
import { env } from "../src/env";
import { z } from "zod";

const inputSchema = z.object({
  term: z.string().default("1255"), // default to Spring 2025
  subject: z.string().default("cs"), // default to cs
});

async function fetchCourses(input: z.infer<typeof inputSchema>) {
  const apiKey = env.UWATERLOO_OPENDATA_API_KEY;

  if (!apiKey) {
    throw new Error("API key not configured");
  }

  const response = await fetch(
    `https://openapi.data.uwaterloo.ca/v3/Courses/${input.term}/${input.subject}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    },
  );

  const data = await response.json();

  // Transform the data to include only selected fields
  const transformedData = data.map((course: any) => ({
    courseId: course.courseId,
    title: course.title,
    subjectCode: course.subjectCode,
    catalogNumber: course.catalogNumber,
    description: course.description,
    requirementsDescription: course.requirementsDescription,
  }));

  // Filter for undergrad courses (1XX-4XX)
  const undergradCourses = transformedData.filter((course: any) => {
    const courseNumber = parseInt(course.catalogNumber);
    return courseNumber >= 100 && courseNumber < 500;
  });

  return undergradCourses;
}

// Parse command line arguments
const args = process.argv.slice(2);
const term =
  args.find((arg) => arg.startsWith("--term="))?.split("=")[1] ?? "1255";
const subject =
  args.find((arg) => arg.startsWith("--subject="))?.split("=")[1] ?? "cs";

const input = inputSchema.parse({ term, subject });

// Execute the fetch
fetchCourses(input)
  .then((courses) => {
    console.log(JSON.stringify(courses, null, 2));
  })
  .catch((error) => {
    console.error("Error fetching courses:", error);
    process.exit(1);
  });
