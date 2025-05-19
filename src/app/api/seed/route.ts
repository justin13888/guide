import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const apiKey = process.env.WATERLOO_API_KEY;
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") || "1255"; // default to 1255 (Spring 2025) if not provided
    const subject = searchParams.get("subject") || "cs"; // default to cs if not provided

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://openapi.data.uwaterloo.ca/v3/Courses/${term}/${subject}`,
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

    return NextResponse.json(undergradCourses[0]);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
