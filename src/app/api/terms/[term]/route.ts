import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// Get information about a specific course
export async function GET(
  request: Request,
  { params }: { params: { term: string } }
) {
  try {
    const { term } = await params;

    const result = await db.execute(
      `SELECT * FROM user_courses WHERE user_id = 'master' AND level_term = '${term}'`
    );

    if (!result.length) {
      return NextResponse.json(
        { error: 'No courses in term' },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching term details:', error);
    return NextResponse.json({ error: 'Failed to fetch term details' }, { status: 500 });
  }
} 