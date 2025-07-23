------------------------ Performance for Fancy Feature 5 ------------------------

-----------------------------
-- DROP indexes if they exist
-----------------------------
DROP INDEX IF EXISTS idx_course_prerequisites_dept_course;
DROP INDEX IF EXISTS idx_course_prerequisites_root_node_id;
DROP INDEX IF EXISTS idx_prerequisite_nodes_parent_id;
DROP INDEX IF EXISTS idx_prerequisite_nodes_dept_course;
DROP INDEX IF EXISTS idx_courses_dept_course;

-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

SELECT '==== WITHOUT INDEXES ====';

EXPLAIN ANALYZE
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

-----------------------------
-- CREATE the indexes
-----------------------------

SELECT '==== CREATING INDEXES ====';

CREATE INDEX idx_course_prerequisites_dept_course
    ON course_prerequisites(department, course_number);
CREATE INDEX idx_course_prerequisites_root_node_id
    ON course_prerequisites(root_node_id);
CREATE INDEX idx_prerequisite_nodes_parent_id
    ON prerequisite_nodes(parent_id);
CREATE INDEX idx_prerequisite_nodes_dept_course
    ON prerequisite_nodes(department, course_number);
CREATE INDEX idx_courses_dept_course
    ON courses(department, course_number);

-----------------------------
-- RUN query WITH indexes
-----------------------------

SELECT '==== WITH INDEXES ====';

EXPLAIN ANALYZE
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