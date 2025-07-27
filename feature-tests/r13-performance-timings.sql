------------------------ Performance for Fancy Feature 3 ------------------------

-----------------------------
-- DROP indexes if they exist
-----------------------------
DROP INDEX IF EXISTS idx_user_courses_dept_course;
DROP INDEX IF EXISTS idx_user_courses_user_id;
DROP INDEX IF EXISTS idx_course_prerequisites_root_node_id;
DROP INDEX IF EXISTS idx_prerequisite_nodes_dept_course;
DROP INDEX IF EXISTS idx_prerequisite_nodes_parent_id;

-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

SELECT '==== WITHOUT INDEXES ====';

EXPLAIN ANALYZE
WITH input_courses AS (
SELECT department, course_number FROM user_courses WHERE user_id = 'master'
),
root_nodes AS (
SELECT ic.department, ic.course_number, cp.root_node_id, pn.relation_type, pn.department AS root_department, pn.course_number AS root_course_number
FROM input_courses ic
LEFT JOIN course_prerequisites cp ON ic.department = cp.department AND ic.course_number = cp.course_number
LEFT JOIN prerequisite_nodes pn ON cp.root_node_id = pn.id
),
unsatisfied AS (
SELECT rn.department, rn.course_number
FROM root_nodes rn
WHERE rn.root_department IS NOT NULL AND rn.root_course_number IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM user_courses uc
    WHERE uc.user_id = 'master'
        AND uc.department = rn.root_department
        AND uc.course_number = rn.root_course_number
    )
UNION
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
            WHERE uc.user_id = 'master'
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
        WHERE uc.user_id = 'master'
            AND uc.department = child.department
            AND uc.course_number = child.course_number
        )
    )
)
UNION
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
                WHERE uc.user_id = 'master'
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
            WHERE uc.user_id = 'master'
            AND uc.department = child.department
            AND uc.course_number = child.course_number
        )
    )
    )
)
)
SELECT department, course_number FROM unsatisfied WHERE department IS NOT NULL AND course_number IS NOT NULL;

-----------------------------
-- CREATE the indexes
-----------------------------

SELECT '==== CREATING INDEXES ====';

CREATE INDEX "idx_user_courses_dept_course" ON "user_courses" USING btree ("department","course_number");
CREATE INDEX "idx_user_courses_user_id" ON "user_courses" USING btree ("user_id");
CREATE INDEX "idx_course_prerequisites_root_node_id" ON "course_prerequisites" USING btree ("root_node_id");
CREATE INDEX "idx_prerequisite_nodes_dept_course" ON "prerequisite_nodes" USING btree ("department","course_number");
CREATE INDEX "idx_prerequisite_nodes_parent_id" ON "prerequisite_nodes" USING btree ("parent_id");

-----------------------------
-- RUN query WITH indexes
-----------------------------

SELECT '==== WITH INDEXES ====';

EXPLAIN ANALYZE
WITH input_courses AS (
SELECT department, course_number FROM user_courses WHERE user_id = 'master'
),
root_nodes AS (
SELECT ic.department, ic.course_number, cp.root_node_id, pn.relation_type, pn.department AS root_department, pn.course_number AS root_course_number
FROM input_courses ic
LEFT JOIN course_prerequisites cp ON ic.department = cp.department AND ic.course_number = cp.course_number
LEFT JOIN prerequisite_nodes pn ON cp.root_node_id = pn.id
),
unsatisfied AS (
SELECT rn.department, rn.course_number
FROM root_nodes rn
WHERE rn.root_department IS NOT NULL AND rn.root_course_number IS NOT NULL
    AND NOT EXISTS (
    SELECT 1 FROM user_courses uc
    WHERE uc.user_id = 'master'
        AND uc.department = rn.root_department
        AND uc.course_number = rn.root_course_number
    )
UNION
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
            WHERE uc.user_id = 'master'
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
        WHERE uc.user_id = 'master'
            AND uc.department = child.department
            AND uc.course_number = child.course_number
        )
    )
)
UNION
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
                WHERE uc.user_id = 'master'
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
            WHERE uc.user_id = 'master'
            AND uc.department = child.department
            AND uc.course_number = child.course_number
        )
    )
    )
)
)
SELECT department, course_number FROM unsatisfied WHERE department IS NOT NULL AND course_number IS NOT NULL;