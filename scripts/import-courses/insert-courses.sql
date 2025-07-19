CREATE OR REPLACE FUNCTION insert_course_with_prerequisites(
  p_department TEXT,
  p_course_number TEXT,
  p_title TEXT,
  p_description TEXT,
  p_requirements TEXT,
  p_units NUMERIC,
  p_min_level TEXT,
  p_fall BOOLEAN,
  p_winter BOOLEAN,
  p_spring BOOLEAN,
  p_prerequisite_nodes JSONB,
  p_program_restrictions JSONB
) RETURNS VOID AS $$
DECLARE
  root_node_id INTEGER;
  node_data JSONB;
BEGIN
  -- Insert or update the course
  INSERT INTO courses (
    department, course_number, title, description, requirements, units, min_level, fall, winter, spring
  ) VALUES (
    p_department, p_course_number, p_title, p_description, p_requirements, p_units, p_min_level, p_fall, p_winter, p_spring
  )
  ON CONFLICT (department, course_number) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    requirements = EXCLUDED.requirements,
    units = EXCLUDED.units,
    min_level = EXCLUDED.min_level,
    fall = EXCLUDED.fall,
    winter = EXCLUDED.winter,
    spring = EXCLUDED.spring;

  -- Insert prerequisite nodes if they exist
  IF p_prerequisite_nodes IS NOT NULL AND jsonb_array_length(p_prerequisite_nodes) > 0 THEN
    -- Insert prerequisite nodes and get the first one's ID as root
    WITH inserted_nodes AS (
      INSERT INTO prerequisite_nodes (parent_id, relation_type, department, course_number, min_grade)
      SELECT 
        NULL,
        (value->>'relationType')::relation_type,
        value->>'department',
        value->>'courseNumber',
        (value->>'minGrade')::INTEGER
      FROM jsonb_array_elements(p_prerequisite_nodes)
      RETURNING id, department, course_number
    )
    SELECT id INTO root_node_id FROM inserted_nodes LIMIT 1;
    
    -- Insert course prerequisites reference
    INSERT INTO course_prerequisites (department, course_number, root_node_id)
    VALUES (p_department, p_course_number, root_node_id)
    ON CONFLICT (department, course_number) DO UPDATE SET
      root_node_id = EXCLUDED.root_node_id;
  END IF;

  -- Insert program restrictions if they exist
  IF p_program_restrictions IS NOT NULL AND jsonb_array_length(p_program_restrictions) > 0 THEN
    INSERT INTO course_program_restrictions (department, course_number, program, min_level, restriction_type)
    SELECT 
      p_department,
      p_course_number,
      value->>'program',
      value->>'minLevel',
      (value->>'restrictionType')::restriction_type
    FROM jsonb_array_elements(p_program_restrictions);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in insert_course_with_prerequisites: %', SQLERRM;
END;
$$ LANGUAGE plpgsql; 
