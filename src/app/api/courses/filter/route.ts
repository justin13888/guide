import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function GET(request: NextRequest) {
  

  try {
    const { searchParams } = new URL(request.url);
    const fall = searchParams.get('fall');
    const winter = searchParams.get('winter');
    const spring = searchParams.get('spring');
    let levels = searchParams.get('levels')?.split(',');

    if (!levels) {
        levels = ['%', '%', '%', '%', '%', '%', '%', '%', '%'];
    }

    const courses = await db.execute(`SELECT department, course_number, title FROM courses
                                        WHERE (fall = true OR fall = ${fall})
                                            AND (winter = true OR winter = ${winter})
                                            AND (spring = true OR spring= ${spring})
                                            AND (course_number LIKE '${levels[0]}'
                                                    OR course_number LIKE '${levels[1]}'
                                                    OR course_number LIKE '${levels[2]}'
                                                    OR course_number LIKE '${levels[3]}'
                                                    OR course_number LIKE '${levels[4]}'
                                                    OR course_number LIKE '${levels[5]}'
                                                    OR course_number LIKE '${levels[6]}'
                                                    OR course_number LIKE '${levels[7]}'
                                                    OR course_number LIKE '${levels[8]}')`);

    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    console.error('Error fetching filtered courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filtered courses' }, 
      { status: 500 }
    );
  }
}