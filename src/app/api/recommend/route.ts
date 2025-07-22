import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// Get information about a specific course
export async function GET(
  request: Request,
) {
  try {

    // Select courses taken DONE 
    // Get courses that have all preqeqs satisfied (build tree from bottom up)
          // Filter by department DONE
          // Start with the prereq nodes for courses taken
          // Recursively select AND nodes with all children in the set, OR nodes with a child in the set
    
          // Include courses without prereqs
     
    // Get prereq tree top down
    // const result = await db.execute(`
    //   WITH RECURSIVE tmp as
    //   (
    //     SELECT pn.department, pn.course_number, pn.id, pn.parent_id, pn.relation_type FROM prerequisite_nodes pn
    //     WHERE pn.id = (SELECT root_node_id FROM course_prerequisites WHERE department = 'MATH' AND course_number = '239')
    //     UNION
    //     SELECT pn.department, pn.course_number, pn.id, pn.parent_id, pn.relation_type FROM prerequisite_nodes pn JOIN tmp ON pn.parent_id = tmp.id
    //   ) 
    //   SELECT * FROM tmp
    // `);

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

    

    // SELECT c.department, c.course_number 
    //   FROM courses c
    //   WHERE c.department in (SELECT department FROM courses_taken)
    //   AND
    //   EXISTS
    //   (
    //     WITH RECURSIVE tmp as
    //     (
    //       SELECT pn.department, pn.course_number, pn.id FROM prerequisite_nodes pn
    //       WHERE pn.id = (SELECT root_node_id FROM course_prerequisites WHERE department = c.department AND course_number = c.course_number)
    //       UNION
    //       SELECT pn.department, pn.course_number, pn.id FROM prerequisite_nodes pn JOIN tmp ON pn.parent_id = tmp.id
    //     ) 
    //     SELECT t.department, t.course_number FROM tmp t JOIN courses_taken ct ON ct.department = t.department AND ct.course_number = t.course_number
    //   )
      
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendation' }, { status: 500 });
  }
} 