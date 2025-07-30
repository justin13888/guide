------------------------ Performance for Prerequisite Tree Query ------------------------

-----------------------------
-- DROP indexes if they exist
-----------------------------
DROP INDEX IF EXISTS idx_prerequisite_nodes_parent_id;
DROP INDEX IF EXISTS idx_prerequisite_nodes_dept_course;
DROP INDEX IF EXISTS idx_course_prerequisites_root_node_id;
DROP INDEX IF EXISTS idx_course_prerequisites_dept_course;


-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

SELECT '==== WITHOUT INDEXES ====';

EXPLAIN ANALYZE
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

-----------------------------
-- CREATE the indexes
-----------------------------

SELECT '==== CREATING INDEXES ====';

-- Index for prerequisite_nodes parent_id (for recursive joins)
CREATE INDEX "idx_prerequisite_nodes_parent_id" ON "prerequisite_nodes" USING btree ("parent_id");

-- Index for prerequisite_nodes department and course_number (for course lookups)
CREATE INDEX "idx_prerequisite_nodes_dept_course" ON "prerequisite_nodes" USING btree ("department", "course_number");

-- Index for course_prerequisites root_node_id (for base case join)
CREATE INDEX "idx_course_prerequisites_root_node_id" ON "course_prerequisites" USING btree ("root_node_id");

-- Index for course_prerequisites department and course_number (for LEFT JOIN in recursive case)
CREATE INDEX "idx_course_prerequisites_dept_course" ON "course_prerequisites" USING btree ("department", "course_number");

-----------------------------
-- RUN query WITH indexes
-----------------------------

SELECT '==== WITH INDEXES ====';

EXPLAIN ANALYZE
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
