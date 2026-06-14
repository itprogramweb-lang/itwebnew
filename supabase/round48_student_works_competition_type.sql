alter table student_works
  drop constraint if exists student_works_work_type_check;

alter table student_works
  add constraint student_works_work_type_check
  check (work_type in ('course', 'final_project', 'competition')) not valid;

alter table student_works
  validate constraint student_works_work_type_check;

comment on constraint student_works_work_type_check on student_works is
  'Allows course works, final projects, and competition/presentation student works.';

