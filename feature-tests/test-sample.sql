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
WITH RECURSIVE prereq_paths AS (
    -- Base case: Start from the root prerequisite node for the target course
    SELECT 
    pn.id,
    pn.parent_id,
    pn.relation_type,
    pn.department,
    pn.course_number,
    pn.min_grade,
    c.title,
    0 as depth,
    CASE 
        WHEN pn.department IS NOT NULL AND pn.course_number IS NOT NULL 
        THEN ARRAY[pn.department || ' ' || pn.course_number]
        ELSE ARRAY[]::text[]
    END as path_array,
    CASE 
        WHEN pn.department IS NOT NULL AND pn.course_number IS NOT NULL 
        THEN pn.department || ' ' || pn.course_number
        ELSE ''
    END as path_string,
    cp.root_node_id as original_root
    FROM course_prerequisites cp
    JOIN prerequisite_nodes pn ON pn.id = cp.root_node_id
    LEFT JOIN courses c ON pn.department = c.department AND pn.course_number = c.course_number
    WHERE cp.department = 'CS' AND cp.course_number = '240'

    UNION ALL

    -- Recursive case: Traverse child nodes based on relation types
    SELECT 
    child.id,
    child.parent_id,
    child.relation_type,
    child.department,
    child.course_number,
    child.min_grade,
    c.title,
    pp.depth + 1,
    CASE 
        WHEN child.department IS NOT NULL AND child.course_number IS NOT NULL 
        THEN 
        CASE 
            WHEN pp.path_array = ARRAY[]::text[] 
            THEN ARRAY[child.department || ' ' || child.course_number]
            ELSE pp.path_array || (child.department || ' ' || child.course_number)
        END
        ELSE pp.path_array
    END,
    CASE 
        WHEN child.department IS NOT NULL AND child.course_number IS NOT NULL 
        THEN 
        CASE 
            WHEN pp.path_string = '' 
            THEN child.department || ' ' || child.course_number
            ELSE pp.path_string || ' -> ' || child.department || ' ' || child.course_number
        END
        ELSE pp.path_string
    END,
    pp.original_root
    FROM prereq_paths pp
    JOIN prerequisite_nodes child ON child.parent_id = pp.id
    LEFT JOIN courses c ON child.department = c.department AND child.course_number = c.course_number
    WHERE pp.depth < 10
    AND (child.department IS NULL OR child.course_number IS NULL OR 
            NOT (child.department || ' ' || child.course_number = ANY(pp.path_array)))
),
-- Extract only the leaf nodes (actual courses) from the prerequisite tree
leaf_courses AS (
    SELECT DISTINCT
    pp.department,
    pp.course_number,
    pp.title,
    pp.depth,
    pp.path_string,
    pp.path_array,
    pp.original_root,
    -- Determine if this is part of an AND or OR relationship by checking parent
    COALESCE(parent.relation_type, 'AND') as parent_relation
    FROM prereq_paths pp
    LEFT JOIN prerequisite_nodes parent ON parent.id = pp.parent_id
    WHERE pp.department IS NOT NULL 
    AND pp.course_number IS NOT NULL
    -- Only include leaf nodes (courses that don't have children in our tree)
    AND NOT EXISTS (
        SELECT 1 FROM prerequisite_nodes child 
        WHERE child.parent_id = pp.id
    )
)
SELECT DISTINCT
    department,
    course_number,
    title,
    depth,
    path_string,
    path_array,
    parent_relation
FROM leaf_courses
ORDER BY depth, department, course_number;





---> Fancy Feature 5
-- This query gets all prerequisites for STAT 231, including any nested ones,
-- and shows when each course is offered.

WITH RECURSIVE prereq_base (
  id, department, course_number, min_grade, path
) AS (
  -- Start from STAT 231’s root prerequisite node
  SELECT
    pn.id,
    pn.department,
    pn.course_number,
    pn.min_grade,
    ARRAY[pn.id]
  FROM course_prerequisites cp
  JOIN prerequisite_nodes pn ON cp.root_node_id = pn.id
  WHERE cp.department = 'STAT' AND cp.course_number = '231'

  UNION ALL

  -- Keep going through the prereq tree (handle AND/OR logic)
  SELECT
    child.id,
    child.department,
    child.course_number,
    child.min_grade,
    pb.path || child.id
  FROM prereq_base pb
  JOIN (
    SELECT
      pn.*,
      ROW_NUMBER() OVER (PARTITION BY pn.parent_id ORDER BY pn.id) AS rn
    FROM prerequisite_nodes pn
  ) child ON child.parent_id = pb.id
  JOIN prerequisite_nodes parent ON parent.id = pb.id
  WHERE NOT child.id = ANY(pb.path)
    AND (
      parent.relation_type = 'AND' OR
      (parent.relation_type = 'OR' AND child.rn = 1)
    )
),

nested_courses (
  id, department, course_number, min_grade, path
) AS (
  -- If any course from above has its own prereqs, dive into that too
  SELECT
    pn2.id,
    pn2.department,
    pn2.course_number,
    pn2.min_grade,
    pb.path || pn2.id
  FROM prereq_base pb
  JOIN course_prerequisites cp2 ON cp2.department = pb.department AND cp2.course_number = pb.course_number
  JOIN prerequisite_nodes pn2 ON cp2.root_node_id = pn2.id
  WHERE NOT pn2.id = ANY(pb.path)

  UNION ALL

  -- Keep walking through these nested trees too
  SELECT
    child.id,
    child.department,
    child.course_number,
    child.min_grade,
    nc.path || child.id
  FROM nested_courses nc
  JOIN (
    SELECT
      pn.*,
      ROW_NUMBER() OVER (PARTITION BY pn.parent_id ORDER BY pn.id) AS rn
    FROM prerequisite_nodes pn
  ) child ON child.parent_id = nc.id
  JOIN prerequisite_nodes parent ON parent.id = nc.id
  WHERE NOT child.id = ANY(nc.path)
    AND (
      parent.relation_type = 'AND' OR
      (parent.relation_type = 'OR' AND child.rn = 1)
    )
),

-- Combine all found prereq courses
all_courses AS (
  SELECT department, course_number, min_grade FROM prereq_base
  UNION
  SELECT department, course_number, min_grade FROM nested_courses
),

-- Add STAT 231 itself
target_course AS (
  SELECT department, course_number, NULL::integer AS min_grade, fall, winter, spring
  FROM courses
  WHERE department = 'STAT' AND course_number = '231'
),

-- Join with course offerings so we know when each course is available
unique_courses AS (
  SELECT ac.department, ac.course_number, ac.min_grade, c.fall, c.winter, c.spring
  FROM all_courses ac
  JOIN courses c ON c.department = ac.department AND c.course_number = ac.course_number
  UNION
  SELECT department, course_number, min_grade, fall, winter, spring FROM target_course
)

-- Final output: clean list of courses with their offerings
SELECT DISTINCT ON (department, course_number)
  department,
  course_number,
  min_grade,
  fall,
  winter,
  spring
FROM unique_courses
ORDER BY department, course_number;
