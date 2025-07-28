------------------------ Performance for Fancy Feature 3 ------------------------

-----------------------------
-- DROP indexes if they exist
-----------------------------
DROP INDEX IF EXISTS idx_prerequisite_nodes_parent_id;


-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

SELECT '==== WITHOUT INDEXES ====';

EXPLAIN ANALYZE
WITH courses_taken(department, course_number) as 
(SELECT department, course_number FROM user_courses WHERE user_id = 'master'),
root_nodes AS 
(
  WITH RECURSIVE prereq_tree AS (
    SELECT p.id, p.parent_id, p.relation_type 
    FROM prerequisite_nodes p JOIN courses_taken ct ON p.department = ct.department AND p.course_number = ct.course_number

    UNION 
    
    SELECT p.id, p.parent_id, p.relation_type  
    FROM prerequisite_nodes p JOIN prereq_tree pt ON pt.parent_id = p.id
  )
  SELECT id FROM prereq_tree WHERE parent_id IS NULL
)
SELECT department, course_number FROM root_nodes JOIN course_prerequisites ON root_node_id = id;

-----------------------------
-- CREATE the indexes
-----------------------------

SELECT '==== CREATING INDEXES ====';

CREATE INDEX "idx_prerequisite_nodes_parent_id" ON "prerequisite_nodes" USING btree ("parent_id");

-----------------------------
-- RUN query WITH indexes
-----------------------------

SELECT '==== WITH INDEXES ====';

EXPLAIN ANALYZE

WITH courses_taken(department, course_number) as 
(SELECT department, course_number FROM user_courses WHERE user_id = 'master'),
root_nodes AS 
(
  WITH RECURSIVE prereq_tree AS (
    SELECT p.id, p.parent_id, p.relation_type 
    FROM prerequisite_nodes p JOIN courses_taken ct ON p.department = ct.department AND p.course_number = ct.course_number

    UNION 
    
    SELECT p.id, p.parent_id, p.relation_type  
    FROM prerequisite_nodes p JOIN prereq_tree pt ON pt.parent_id = p.id
  )
  SELECT id FROM prereq_tree WHERE parent_id IS NULL
)
SELECT department, course_number FROM root_nodes JOIN course_prerequisites ON root_node_id = id;