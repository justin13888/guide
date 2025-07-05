import { antirequisites } from 'drizzle/schema';
import { NextResponse } from 'next/server';
import { db } from "~/server/db";

export async function GET(
  request: Request,
  { params }: { params: { course: string } }
) {
  try {
    const { course } = await params;
    const [department, courseNumber] = course.split('-');
    
    if (!department || !courseNumber) {
      return NextResponse.json(
        { error: 'Invalid course format. Expected format: department-number (eg. CS-101)' },
        { status: 400 }
      );
    }

    const antirequisites = await db.execute(
        `SELECT
          ar.antirequisite_department AS department,
          ar.antirequisite_course_number AS course_number,
          c.title AS title
        FROM antirequisites AS ar
        LEFT JOIN courses AS c
        ON ar.antirequisite_department = c.department AND ar.antirequisite_course_number = c.course_number
        WHERE ar.department = '${department}' AND ar.course_number = '${courseNumber}'`
    );

    return NextResponse.json({ success: true, data: antirequisites });
  } catch (error) {
    console.error("Error fetching antirequisites:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch antirequisites" },
      { status: 500 }
    );
  }
} 