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
      WITH input_courses AS (
        SELECT department, course_number, level_term FROM user_courses WHERE user_id = 'master'
      ),
      -- Define term order for validation
      term_order AS (
        SELECT term, position FROM (VALUES
          ('1A', 1), ('1B', 2), ('W1', 3), ('2A', 4), ('W2', 5), 
          ('2B', 6), ('W3', 7), ('3A', 8), ('W4', 9), ('3B', 10), 
          ('4A', 11), ('W5', 12), ('W6', 13), ('4B', 14)
        ) AS t(term, position)
      ),
      root_nodes AS (
        SELECT 
          ic.department, 
          ic.course_number, 
          ic.level_term,
          cp.root_node_id, 
          pn.relation_type, 
          pn.department AS root_department, 
          pn.course_number AS root_course_number,
          pn.min_grade
        FROM input_courses ic
        LEFT JOIN course_prerequisites cp ON ic.department = cp.department AND ic.course_number = cp.course_number
        LEFT JOIN prerequisite_nodes pn ON cp.root_node_id = pn.id
      ),
      -- Check unsatisfied prerequisites (including term order)
      unsatisfied_prereqs AS (
        -- Case 0: Root is a prerequisite course (leaf node)
        SELECT rn.department, rn.course_number, 'Missing prerequisite' as issue_type
        FROM root_nodes rn
        WHERE rn.root_department IS NOT NULL AND rn.root_course_number IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM user_courses uc
            JOIN term_order to1 ON uc.level_term = to1.term
            JOIN term_order to2 ON rn.level_term = to2.term
            WHERE uc.user_id = 'master'
              AND uc.department = rn.root_department
              AND uc.course_number = rn.root_course_number
              AND to1.position < to2.position 
          )
        
        UNION
        
        -- Case 1: Root is AND (all children must be satisfied with term order)
        SELECT rn.department, rn.course_number, 'Missing prerequisite' as issue_type
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
                    JOIN term_order to1 ON uc.level_term = to1.term
                    JOIN term_order to2 ON rn.level_term = to2.term
                    WHERE uc.user_id = 'master'
                      AND uc.department = leaf.department
                      AND uc.course_number = leaf.course_number
                      AND to1.position < to2.position
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
                JOIN term_order to1 ON uc.level_term = to1.term
                JOIN term_order to2 ON rn.level_term = to2.term
                WHERE uc.user_id = 'master'
                  AND uc.department = child.department
                  AND uc.course_number = child.course_number
                  AND to1.position < to2.position
              )
          )
        )
        
        UNION
        
        -- Case 2: Root is OR (at least one child must be satisfied with term order)
        SELECT rn.department, rn.course_number, 'Missing prerequisite' as issue_type
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
                      JOIN term_order to1 ON uc.level_term = to1.term
                      JOIN term_order to2 ON rn.level_term = to2.term
                      WHERE uc.user_id = 'master'
                        AND uc.department = leaf.department
                        AND uc.course_number = leaf.course_number
                        AND to1.position < to2.position
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
                  JOIN term_order to1 ON uc.level_term = to1.term
                  JOIN term_order to2 ON rn.level_term = to2.term
                  WHERE uc.user_id = 'master'
                    AND uc.department = child.department
                    AND uc.course_number = child.course_number
                    AND to1.position < to2.position
                )
            )
          )
        )
      )
      SELECT 
        department,
        course_number,
        issue_type,
        NULL as conflict_department,
        NULL as conflict_course_number
      FROM unsatisfied_prereqs
      WHERE department IS NOT NULL AND course_number IS NOT NULL
    `;

    const result = await db.execute(sql);
    return NextResponse.json({ unsatisfied: result });
  } catch (error) {
    console.error('Error validating prerequisites:', error);
    return NextResponse.json({ error: 'Failed to validate prerequisites' }, { status: 500 });
  }
}
