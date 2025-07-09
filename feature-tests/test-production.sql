--> Basic Feature 1
SELECT department, COUNT(*)
	FROM courses
	GROUP BY department
	ORDER BY COUNT(*) DESC

--> Basic Feature 2
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

--> Basic Feature 5
