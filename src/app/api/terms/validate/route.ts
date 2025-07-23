import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// Get information about a specific course
export async function GET(
  request: Request,
) {
  try {
    
    const result = await db.execute(
      `SELECT
        uc.user_id,
        uc.level_term,
        COUNT(*) AS num_courses,
        SUM(CASE WHEN c.department <> 'PD' THEN c.units ELSE 0 END) AS total_units_excl_pd,
        CASE
          WHEN uc.level_term IN ('1A','1B','2A','2B','3A','3B','4A','4B') AND COUNT(*) > 7
            THEN 'TOO MANY COURSES'
          WHEN uc.level_term NOT IN ('1A','1B','2A','2B','3A','3B','4A','4B') AND SUM(CASE WHEN c.department <> 'PD' THEN c.units ELSE 0 END) > 0.5
            THEN 'TOO MANY UNITS'
          ELSE 'OK'
        END AS load_status
      FROM user_courses uc
      JOIN courses c
        ON uc.department = c.department AND uc.course_number = c.course_number
      GROUP BY uc.user_id, uc.level_term
      ORDER BY uc.user_id, uc.level_term;
      `
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching validating term:', error);
    return NextResponse.json({ error: 'Failed to fetch to validate term' }, { status: 500 });
  }
} 