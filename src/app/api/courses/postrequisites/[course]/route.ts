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

    const postrequisites = await db.execute(
      `SELECT 
        cp.course_number AS course_number,
        cp.department AS department
      FROM course_prerequisites AS cp
      JOIN prerequisite_nodes AS pn ON cp.root_node_id = pn.parent_id
      JOIN prerequisite_nodes AS pn2 ON pn.id = pn2.parent_id
      WHERE (pn.department = '${department}' AND pn.course_number = '${courseNumber}') OR
            (pn2.department = '${department}' AND pn2.course_number = '${courseNumber}')`
    );

    return NextResponse.json({ success: true, data: postrequisites });
  } catch (error) {
    console.error("Error fetching postrequisites:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch postrequisites" },
      { status: 500 }
    );
  }
} 