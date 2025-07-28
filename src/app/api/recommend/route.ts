import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// Get information about a specific course
export async function GET(
  request: Request,
) {
  try {

    const result = await db.execute(`
      WITH courses_taken(department, course_number) as 
      (SELECT department, course_number FROM user_courses WHERE user_id = 'master'),

      root_nodes AS 
      (
        WITH RECURSIVE prereq_tree AS (
          SELECT p.id, p.parent_id, p.relation_type 
          FROM prerequisite_nodes p JOIN courses_taken ct ON p.department = ct.department AND p.course_number = ct.course_number

          UNION 
          
          SELECT p.id, p.parent_id, p.relation_type  
          FROM prerequisite_nodes p JOIN prereq_tree pt ON pt.parent_id = p.id
        )
        SELECT id FROM prereq_tree WHERE parent_id IS NULL
      )
      SELECT department, course_number FROM root_nodes JOIN course_prerequisites ON root_node_id = id
    `)
    
      
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendation' }, { status: 500 });
  }
} 