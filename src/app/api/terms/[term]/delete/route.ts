import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// Get information about a specific course
export async function DELETE(
  request: Request,
  { params }: { params: { term: string } }
) {
  try {
    const { term } = await params;
    const body = await request.json();
    const { course } = await body; 
    const [department, courseNumber] = course.split('-');
    
    if (!department || !courseNumber) {
      return NextResponse.json(
        { error: 'Invalid course format. Expected format: department-number (eg. CS-101)' },
        { status: 400 }
      );
    }

    await db.execute(
      `DELETE FROM user_courses WHERE user_id = 'master' AND department = '${department}' AND course_number = '${courseNumber}' AND level_term = '${term}'`
    );

    return NextResponse.json({ message: 'success'});
  } catch (error) {
    console.error('Error updating term details:', error);
    return NextResponse.json({ error: 'Failed to update term details' }, { status: 500 });
  }
} 