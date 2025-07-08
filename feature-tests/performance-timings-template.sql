-----------------------------
-- DROP indexes if they exist
-----------------------------
DROP INDEX IF EXISTS ...;
DROP INDEX IF EXISTS ...;

-----------------------------
-- RUN query WITHOUT indexes
-----------------------------

EXPLAIN ANALYZE
<QUERY>

-----------------------------
-- CREATE the indexes
-----------------------------

CREATE INDEX <INDEX_NAME>
    ON ...;
CREATE INDEX <INDEX_NAME>
    ON ...;


-----------------------------
-- RUN query WITH indexes
-----------------------------

EXPLAIN ANALYZE
<QUERY>
