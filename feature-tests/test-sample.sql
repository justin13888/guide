--> Basic Feature 1
SELECT department, COUNT(*)
	FROM courses
	GROUP BY department
	ORDER BY COUNT(*) DESC;

--> Basic Feature 2
SELECT department, course_number, title
	FROM courses
	WHERE (fall = true OR fall = true)
        AND (winter = true OR winter = true)
        AND (spring = true OR spring = false)
        AND (course_number LIKE '1%'
        OR course_number LIKE '%'
        OR course_number LIKE '%'
        OR course_number LIKE '%'
        OR course_number LIKE '%'
        OR course_number LIKE '%'
        OR course_number LIKE '%'
        OR course_number LIKE '%'
        OR course_number LIKE '%');

--> Basic Feature 3
SELECT DISTINCT
    cp.course_number AS course_number,
    cp.department AS department
    FROM course_prerequisites AS cp
    JOIN prerequisite_nodes AS pn ON cp.root_node_id = pn.parent_id
    JOIN prerequisite_nodes AS pn2 on pn.id = pn2.parent_id
    WHERE (pn.department = 'STAT' AND pn.course_number = '230') OR
          (pn2.department = 'STAT' AND pn2.course_number = '230');

--> Basic Feature 4
SELECT
	ar.antirequisite_department AS department,
	ar.antirequisite_course_number AS course_number,
	c.title AS title
	FROM antirequisites AS ar
	LEFT JOIN courses AS c
	ON ar.antirequisite_department = c.department AND
	    ar.antirequisite_course_number = c.course_number
	WHERE ar.department = 'STAT' AND ar.course_number = '231';

---> Basic Feature 5
SELECT
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

--> Fancy Feature 1
WITH RECURSIVE prerequisite_tree AS (
    -- Base case: Start with a specific course
    SELECT 
        pn.id as node_id,
        pn.relation_type,
        pn.department,
        pn.course_number,
        NULL::integer as parent_node_id,
        NULL::relation_type as parent_relation_type,
        NULL::varchar(10) as parent_department,
        NULL::varchar(10) as parent_course_number
    FROM course_prerequisites cp
    JOIN prerequisite_nodes pn ON cp.root_node_id = pn.id
    WHERE cp.department = 'CS' AND cp.course_number = '480'

    UNION ALL

    -- Recursive case: Get prerequisite nodes (children of current node)
    SELECT 
        COALESCE(next_root.root_node_id, child.id) as node_id,
        child.relation_type,
        child.department,
        child.course_number,
        pt.node_id as parent_node_id,
        pt.relation_type as parent_relation_type,
        pt.department as parent_department,
        pt.course_number as parent_course_number
    FROM prerequisite_tree pt
    JOIN prerequisite_nodes child ON child.parent_id = pt.node_id
    LEFT JOIN course_prerequisites next_root ON 
        child.department = next_root.department AND 
        child.course_number = next_root.course_number
)
-- Get all nodes, including intermediary AND/OR nodes
SELECT DISTINCT
    node_id,
    relation_type,
    department,
    course_number,
    parent_node_id,
    parent_relation_type,
    parent_department,
    parent_course_number
FROM prerequisite_tree
ORDER BY 
    node_id,
    department,
    course_number,
    parent_department,
    parent_course_number;


---> Fancy Feature 5
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
