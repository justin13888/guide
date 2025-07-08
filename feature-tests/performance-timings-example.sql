------------------------ Example for Basic Feature 3 (R9) ------------------------

-----------------------------
-- DROP indexes if they exist
-----------------------------

DROP INDEX IF EXISTS idx_prerequisite_nodes_dept_course;
DROP INDEX IF EXISTS idx_prerequisite_nodes_parent_id;
DROP INDEX IF EXISTS idx_course_prerequisites_root_node_id;

-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

SELECT '==== WITHOUT INDEXES ====';

EXPLAIN ANALYZE
SELECT DISTINCT
    cp.course_number AS course_number,
    cp.department AS department
FROM course_prerequisites AS cp
JOIN prerequisite_nodes AS pn ON cp.root_node_id = pn.parent_id
JOIN prerequisite_nodes AS pn2 ON pn.id = pn2.parent_id
WHERE (pn.department = 'STAT' AND pn.course_number = '230')
   OR (pn2.department = 'STAT' AND pn2.course_number = '230');

-----------------------------
-- CREATE the indexes
-----------------------------

SELECT '==== CREATING INDEXES ====';

CREATE INDEX idx_prerequisite_nodes_dept_course
    ON prerequisite_nodes (department, course_number);

CREATE INDEX idx_prerequisite_nodes_parent_id
    ON prerequisite_nodes (parent_id);

CREATE INDEX idx_course_prerequisites_root_node_id
    ON course_prerequisites (root_node_id);

-----------------------------
-- RUN query WITH indexes
-----------------------------

SELECT '==== WITH INDEXES ====';

EXPLAIN ANALYZE
SELECT DISTINCT
    cp.course_number AS course_number,
    cp.department AS department
FROM course_prerequisites AS cp
JOIN prerequisite_nodes AS pn ON cp.root_node_id = pn.parent_id
JOIN prerequisite_nodes AS pn2 ON pn.id = pn2.parent_id
WHERE (pn.department = 'STAT' AND pn.course_number = '230')
   OR (pn2.department = 'STAT' AND pn2.course_number = '230');
