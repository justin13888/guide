import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// Get information about a specific course
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

    const result = await db.execute(
      `SELECT title, description, requirements FROM courses WHERE department = '${department}' AND course_number = '${courseNumber}'`
    );

    if (!result.length) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
  }
} 