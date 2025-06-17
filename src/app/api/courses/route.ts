import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// Get full list of courses
export async function GET() {
  try {
    const result = await db.execute('SELECT department, course_number FROM courses');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching course list:', error);
    return NextResponse.json({ error: 'Failed to fetch course list' }, { status: 500 });
  }
} 