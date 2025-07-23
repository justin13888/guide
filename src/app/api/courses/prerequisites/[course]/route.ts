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
     
    // Get prereq tree top down
    const nodes = await db.execute(`
      WITH RECURSIVE tmp as
      (
        SELECT pn.department, pn.course_number, pn.id, pn.parent_id, pn.relation_type FROM prerequisite_nodes pn
        WHERE pn.id = (SELECT root_node_id FROM course_prerequisites WHERE department = '${department}' AND course_number = '${courseNumber}')
        UNION
        SELECT pn.department, pn.course_number, pn.id, pn.parent_id, pn.relation_type FROM prerequisite_nodes pn JOIN tmp ON pn.parent_id = tmp.id
      ) 
      SELECT * FROM tmp
    `);

    const root_id = await db.execute(`
      SELECT root_node_id FROM course_prerequisites WHERE department = '${department}' AND course_number = '${courseNumber}'
    `);
    
    return NextResponse.json({nodes: nodes, root_id: root_id});
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendation' }, { status: 500 });
  }
} 