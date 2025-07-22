------------------------ Example for Basic Feature 3 (R9) ------------------------

-----------------------------
-- DROP indexes if they exist
-----------------------------

DROP INDEX IF EXISTS idx_courses_departments;

-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

SELECT '==== WITHOUT INDEXES ====';

EXPLAIN ANALYZE
SELECT department, COUNT(*)
	FROM courses
	GROUP BY department
	ORDER BY COUNT(*) DESC;

-----------------------------
-- CREATE the indexes
-----------------------------

SELECT '==== CREATING INDEXES ====';

CREATE INDEX idx_courses_departments
    ON courses(department);

-----------------------------
-- RUN query WITH indexes
-----------------------------

SELECT '==== WITH INDEXES ====';

EXPLAIN ANALYZE
SELECT department, COUNT(*)
	FROM courses
	GROUP BY department
	ORDER BY COUNT(*) DESC;