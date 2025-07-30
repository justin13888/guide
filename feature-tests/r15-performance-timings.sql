------------------------ Performance for Fancy Feature 5 ------------------------

-----------------------------
-- DROP indexes if they exist
-----------------------------
DROP INDEX IF EXISTS idx_user_courses_user_level_term;
DROP INDEX IF EXISTS idx_user_courses_user_dept_course_term;
DROP INDEX IF EXISTS idx_prerequisite_nodes_parent_relation;
DROP INDEX IF EXISTS idx_prerequisite_nodes_parent_dept_course;
DROP INDEX IF EXISTS idx_courses_dept_course;

-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

SELECT '==== WITHOUT INDEXES ====';

EXPLAIN ANALYZE
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
),
-- Check antirequisites
antireq_conflicts AS (
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
  WHERE uc1.user_id = 'master' AND uc2.user_id = 'master'
)
-- Combine both checks
SELECT 
  department, 
  course_number,
  issue_type,
  NULL as conflict_department,
  NULL as conflict_course_number
FROM unsatisfied_prereqs
WHERE department IS NOT NULL AND course_number IS NOT NULL

UNION ALL

SELECT 
  department, 
  course_number, 
  issue_type,
  conflict_department,
  conflict_course_number
FROM antireq_conflicts;

-----------------------------
-- CREATE the indexes
-----------------------------

SELECT '==== CREATING INDEXES ====';

CREATE INDEX idx_user_courses_user_level_term ON user_courses(user_id, level_term);
CREATE INDEX idx_user_courses_user_dept_course_term ON user_courses(user_id, department, course_number, level_term);
CREATE INDEX idx_prerequisite_nodes_parent_relation ON prerequisite_nodes(parent_id, relation_type);
CREATE INDEX idx_prerequisite_nodes_parent_dept_course ON prerequisite_nodes(parent_id, department, course_number);
CREATE INDEX idx_courses_dept_course ON courses(department, course_number);

-----------------------------
-- RUN query WITH indexes
-----------------------------

SELECT '==== WITH INDEXES ====';

EXPLAIN ANALYZE
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
),
-- Check antirequisites
antireq_conflicts AS (
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
  WHERE uc1.user_id = 'master' AND uc2.user_id = 'master'
)
-- Combine both checks
SELECT 
  department, 
  course_number,
  issue_type,
  NULL as conflict_department,
  NULL as conflict_course_number
FROM unsatisfied_prereqs
WHERE department IS NOT NULL AND course_number IS NOT NULL

UNION ALL

SELECT 
  department, 
  course_number, 
  issue_type,
  conflict_department,
  conflict_course_number
FROM antireq_conflicts; 