--> Indices for Basic Feature 1
CREATE INDEX idx_courses_departments
    ON courses(department);

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
        OR course_number LIKE '%')

--> Basic Feature 3
SELECT DISTINCT
    cp.course_number AS course_number,
    cp.department AS department
    FROM course_prerequisites AS cp
    JOIN prerequisite_nodes AS pn ON cp.root_node_id = pn.parent_id
    JOIN prerequisite_nodes AS pn2 on pn.id = pn2.parent_id
    WHERE (pn.department = 'STAT' AND pn.course_number = '230') OR
          (pn2.department = 'STAT' AND pn2.course_number = '230')

--> Indices for Basic Feature 3
CREATE INDEX idx_prerequisite_nodes_dept_course
    ON prerequisite_nodes (department, course_number);

CREATE INDEX idx_prerequisite_nodes_parent_id
    ON prerequisite_nodes (parent_id);

CREATE INDEX idx_course_prerequisites_root_node_id
    ON course_prerequisites (root_node_id);

--> Basic Feature 4
SELECT
	ar.antirequisite_department AS department,
	ar.antirequisite_course_number AS course_number,
	c.title AS title
	FROM antirequisites AS ar
	LEFT JOIN courses AS c
	ON ar.antirequisite_department = c.department AND
	    ar.antirequisite_course_number = c.course_number
	WHERE ar.department = 'STAT' AND ar.course_number = '231'

--> Indices for Basic Feature 4
CREATE INDEX idx_antirequisites_department_course
    ON antirequisites (department, course_number);

CREATE INDEX idx_antirequisites_antidept_anticourse
    ON antirequisites (antirequisite_department, antirequisite_course_number);

--> Basic Feature 5
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prerequisite_nodes_parent_id ON prerequisite_nodes(parent_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prerequisite_nodes_dept_course ON prerequisite_nodes(department, course_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_prerequisites_dept_course ON course_prerequisites(department, course_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_prerequisites_root_node ON course_prerequisites(root_node_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_dept_course ON courses(department, course_number);

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
