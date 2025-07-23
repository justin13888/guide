import { NextResponse } from 'next/server';
import { db } from '~/server/db';

// POST: { user_id: string }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Get all courses for the user
    // Then check prerequisites for each
    const sql = `
      WITH input_courses AS (
        SELECT department, course_number FROM user_courses WHERE user_id = '${user_id}'
      ),
      root_nodes AS (
        SELECT ic.department, ic.course_number, cp.root_node_id, pn.relation_type, pn.department AS root_department, pn.course_number AS root_course_number
        FROM input_courses ic
        LEFT JOIN course_prerequisites cp ON ic.department = cp.department AND ic.course_number = cp.course_number
        LEFT JOIN prerequisite_nodes pn ON cp.root_node_id = pn.id
      ),
      unsatisfied AS (
        -- Case 0: Root is a prerequisite course (leaf node)
        SELECT rn.department, rn.course_number
        FROM root_nodes rn
        WHERE rn.root_department IS NOT NULL AND rn.root_course_number IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM user_courses uc
            WHERE uc.user_id = '${user_id}'
              AND uc.department = rn.root_department
              AND uc.course_number = rn.root_course_number
          )
        
        UNION
        
        -- Case 1: Root is AND (all children must be satisfied)
        SELECT rn.department, rn.course_number
        FROM root_nodes rn
        WHERE rn.relation_type = 'AND' AND (
          EXISTS (
            SELECT 1 FROM prerequisite_nodes child
            WHERE child.parent_id = rn.root_node_id
              AND child.relation_type = 'OR'
              AND NOT EXISTS (
                SELECT 1 FROM prerequisite_nodes leaf
                WHERE leaf.parent_id = child.id
                  AND EXISTS (
                    SELECT 1 FROM user_courses uc
                    WHERE uc.user_id = '${user_id}'
                      AND uc.department = leaf.department
                      AND uc.course_number = leaf.course_number
                  )
              )
          )
          OR
          EXISTS (
            SELECT 1 FROM prerequisite_nodes child
            WHERE child.parent_id = rn.root_node_id
              AND child.relation_type IS NULL
              AND (child.department IS NOT NULL AND child.course_number IS NOT NULL)
              AND NOT EXISTS (
                SELECT 1 FROM user_courses uc
                WHERE uc.user_id = '${user_id}'
                  AND uc.department = child.department
                  AND uc.course_number = child.course_number
              )
          )
        )
        
        UNION
        
        -- Case 2: Root is OR (at least one child must be satisfied)
        SELECT rn.department, rn.course_number
        FROM root_nodes rn
        WHERE rn.relation_type = 'OR' AND NOT (
          (
            EXISTS (
              SELECT 1 FROM prerequisite_nodes child
              WHERE child.parent_id = rn.root_node_id
                AND child.relation_type = 'AND'
                AND NOT EXISTS (
                  SELECT 1 FROM prerequisite_nodes leaf
                  WHERE leaf.parent_id = child.id
                    AND NOT EXISTS (
                      SELECT 1 FROM user_courses uc
                      WHERE uc.user_id = '${user_id}'
                        AND uc.department = leaf.department
                        AND uc.course_number = leaf.course_number
                    )
                )
            )
          )
          OR
          (
            EXISTS (
              SELECT 1 FROM prerequisite_nodes child
              WHERE child.parent_id = rn.root_node_id
                AND child.relation_type IS NULL
                AND (child.department IS NOT NULL AND child.course_number IS NOT NULL)
                AND EXISTS (
                  SELECT 1 FROM user_courses uc
                  WHERE uc.user_id = '${user_id}'
                    AND uc.department = child.department
                    AND uc.course_number = child.course_number
                )
            )
          )
        )
      )
      SELECT department, course_number FROM unsatisfied WHERE department IS NOT NULL AND course_number IS NOT NULL;
    `;

    const result = await db.execute(sql);
    return NextResponse.json({ unsatisfied: result });
  } catch (error) {
    console.error('Error validating prerequisites:', error);
    return NextResponse.json({ error: 'Failed to validate prerequisites' }, { status: 500 });
  }
}
