INSERT INTO departments (id, name) VALUES
  (1, 'HR'), (2, 'IT'), (3, 'Logistics')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs (id, name, department_id) VALUES
  (1, 'Software Engineer', 2),
  (2, 'SysAdmin', 2),
  (3, 'Recruiter', 1)
ON CONFLICT (id) DO NOTHING;

UPDATE users SET department_id = 2, job_title = 'Software Engineer' WHERE id = 9;
