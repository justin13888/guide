import { NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const sql = `
      WITH antireq_conflicts AS (
        SELECT 
            uc1.department, 
            uc1.course_number,
            'Antirequisite conflict' as issue_type,
            uc2.department as conflict_department,
            uc2.course_number as conflict_course_number
        FROM user_courses uc1
        JOIN antirequisites a ON uc1.department = a.department AND uc1.course_number = a.course_number
        JOIN user_courses uc2 ON a.antirequisite_department = uc2.department 
            AND a.antirequisite_course_number = uc2.course_number
        WHERE uc1.user_id = '${user_id}' AND uc2.user_id = '${user_id}'
      )
      SELECT 
        department, 
        course_number, 
        issue_type,
        conflict_department,
        conflict_course_number
      FROM antireq_conflicts;
    `;

    const result = await db.execute(sql);
    return NextResponse.json({ unsatisfied: result });
  } catch (error) {
    console.error('Error validating antirequisites:', error);
    return NextResponse.json({ error: 'Failed to validate antirequisites' }, { status: 500 });
  }
}
