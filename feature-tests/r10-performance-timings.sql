-----------------------------
-- DROP indexes if they exist
-----------------------------
DROP INDEX IF EXISTS idx_user_courses_dept_course;
DROP INDEX IF EXISTS idx_user_courses_userid_levelterm;
DROP INDEX IF EXISTS idx_courses_dept_course;

-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

EXPLAIN ANALYZE
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

-----------------------------
-- CREATE the indexes
-----------------------------

CREATE INDEX idx_user_courses_dept_course ON user_courses(department, course_number);
CREATE INDEX idx_user_courses_userid_levelterm ON user_courses(user_id, level_term);
CREATE INDEX idx_courses_dept_course ON courses(department, course_number);

-----------------------------
-- RUN query WITH indexes
-----------------------------

EXPLAIN ANALYZE
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