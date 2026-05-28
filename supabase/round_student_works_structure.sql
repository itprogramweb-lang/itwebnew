-- เพิ่มโครงสร้างผลงานนักศึกษาสำหรับแยกงานรายวิชาและโปรเจกต์จบ

ALTER TABLE student_works
  ADD COLUMN IF NOT EXISTS work_type text NOT NULL DEFAULT 'final_project';

ALTER TABLE student_works
  ADD COLUMN IF NOT EXISTS course_id text;

ALTER TABLE student_works
  ADD COLUMN IF NOT EXISTS course_name text;

ALTER TABLE student_works
  ADD COLUMN IF NOT EXISTS pdf_url text;

ALTER TABLE student_works
  ADD COLUMN IF NOT EXISTS pdf_filename text;

UPDATE student_works
SET work_type = 'final_project'
WHERE work_type IS NULL OR work_type NOT IN ('course', 'final_project');

ALTER TABLE student_works
  ALTER COLUMN work_type SET DEFAULT 'final_project';

ALTER TABLE student_works
  ALTER COLUMN work_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_works_work_type_check'
      AND conrelid = 'student_works'::regclass
  ) THEN
    ALTER TABLE student_works
      ADD CONSTRAINT student_works_work_type_check
      CHECK (work_type IN ('course', 'final_project')) NOT VALID;
  END IF;
END;
$$;

ALTER TABLE student_works
  VALIDATE CONSTRAINT student_works_work_type_check;

CREATE INDEX IF NOT EXISTS idx_student_works_work_type
  ON student_works(work_type);

CREATE INDEX IF NOT EXISTS idx_student_works_course_id
  ON student_works(course_id);

CREATE INDEX IF NOT EXISTS idx_student_works_academic_year
  ON student_works(academic_year);

CREATE INDEX IF NOT EXISTS idx_student_works_work_type_year
  ON student_works(work_type, academic_year);
