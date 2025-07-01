-- MetroPower Dashboard - Production Data Seeding
-- This script populates the production database with sample projects and assignments

-- Insert sample projects
INSERT INTO projects (project_id, name, number, status, start_date, end_date, location, description) VALUES
('PROJ-A-12345', 'Tucker Mall Renovation', 'TM-2024-001', 'Active', '2024-06-01', '2024-08-15', '4166 Lavista Rd, Tucker, GA 30084', 'Complete electrical renovation of Tucker Mall food court and common areas'),
('PROJ-B-67890', 'Office Complex Wiring', 'OC-2024-002', 'Active', '2024-06-10', '2024-07-30', '1234 Business Blvd, Tucker, GA 30084', 'New construction electrical installation for 3-story office building'),
('PROJ-C-11111', 'Residential Development', 'RD-2024-003', 'Active', '2024-05-15', '2024-09-01', '5678 Residential Way, Tucker, GA 30084', 'Electrical installation for 12-unit townhome development')
ON CONFLICT (project_id) DO NOTHING;

-- Get admin user ID for assignments
-- Note: This assumes admin user exists with user_id = 1

-- Insert sample assignments for current week (July 1-5, 2025)
-- Monday (2025-06-30)
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('004531', 'PROJ-A-12345', '2025-06-30', 1),
('301001', 'PROJ-A-12345', '2025-06-30', 1),
('301010', 'PROJ-A-12345', '2025-06-30', 1),
('300823', 'PROJ-A-12345', '2025-06-30', 1),
('300959', 'PROJ-A-12345', '2025-06-30', 1)
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Tuesday (2025-07-01)
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('004531', 'PROJ-B-67890', '2025-07-01', 1),
('301001', 'PROJ-B-67890', '2025-07-01', 1),
('301010', 'PROJ-B-67890', '2025-07-01', 1),
('300823', 'PROJ-B-67890', '2025-07-01', 1),
('300959', 'PROJ-B-67890', '2025-07-01', 1)
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Wednesday (2025-07-02)
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('004531', 'PROJ-C-11111', '2025-07-02', 1),
('301001', 'PROJ-C-11111', '2025-07-02', 1),
('301010', 'PROJ-C-11111', '2025-07-02', 1),
('300823', 'PROJ-C-11111', '2025-07-02', 1),
('300959', 'PROJ-C-11111', '2025-07-02', 1)
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Thursday (2025-07-03)
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('004531', 'PROJ-A-12345', '2025-07-03', 1),
('301001', 'PROJ-A-12345', '2025-07-03', 1),
('301010', 'PROJ-A-12345', '2025-07-03', 1),
('300823', 'PROJ-A-12345', '2025-07-03', 1),
('300959', 'PROJ-A-12345', '2025-07-03', 1)
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Friday (2025-07-04)
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('004531', 'PROJ-B-67890', '2025-07-04', 1),
('301001', 'PROJ-B-67890', '2025-07-04', 1),
('301010', 'PROJ-B-67890', '2025-07-04', 1),
('300823', 'PROJ-B-67890', '2025-07-04', 1),
('300959', 'PROJ-B-67890', '2025-07-04', 1)
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Add more employees to assignments for better coverage
-- Monday additional assignments
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('300084', 'PROJ-A-12345', '2025-06-30', 1), -- Calvin Beecher
('300008', 'PROJ-A-12345', '2025-06-30', 1), -- David Montes
('004484', 'PROJ-B-67890', '2025-06-30', 1), -- Gustavo Rodriguez
('301357', 'PROJ-B-67890', '2025-06-30', 1), -- Jose Medina
('003642', 'PROJ-C-11111', '2025-06-30', 1)  -- Joseph Perez
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Tuesday additional assignments
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('300084', 'PROJ-B-67890', '2025-07-01', 1), -- Calvin Beecher
('300008', 'PROJ-B-67890', '2025-07-01', 1), -- David Montes
('004484', 'PROJ-C-11111', '2025-07-01', 1), -- Gustavo Rodriguez
('301357', 'PROJ-C-11111', '2025-07-01', 1), -- Jose Medina
('003642', 'PROJ-A-12345', '2025-07-01', 1)  -- Joseph Perez
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Wednesday additional assignments
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('300084', 'PROJ-C-11111', '2025-07-02', 1), -- Calvin Beecher
('300008', 'PROJ-C-11111', '2025-07-02', 1), -- David Montes
('004484', 'PROJ-A-12345', '2025-07-02', 1), -- Gustavo Rodriguez
('301357', 'PROJ-A-12345', '2025-07-02', 1), -- Jose Medina
('003642', 'PROJ-B-67890', '2025-07-02', 1)  -- Joseph Perez
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Thursday additional assignments
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('300084', 'PROJ-A-12345', '2025-07-03', 1), -- Calvin Beecher
('300008', 'PROJ-A-12345', '2025-07-03', 1), -- David Montes
('004484', 'PROJ-B-67890', '2025-07-03', 1), -- Gustavo Rodriguez
('301357', 'PROJ-B-67890', '2025-07-03', 1), -- Jose Medina
('003642', 'PROJ-C-11111', '2025-07-03', 1)  -- Joseph Perez
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Friday additional assignments
INSERT INTO assignments (employee_id, project_id, assignment_date, created_by) VALUES
('300084', 'PROJ-B-67890', '2025-07-04', 1), -- Calvin Beecher
('300008', 'PROJ-B-67890', '2025-07-04', 1), -- David Montes
('004484', 'PROJ-C-11111', '2025-07-04', 1), -- Gustavo Rodriguez
('301357', 'PROJ-C-11111', '2025-07-04', 1), -- Jose Medina
('003642', 'PROJ-A-12345', '2025-07-04', 1)  -- Joseph Perez
ON CONFLICT (employee_id, assignment_date) DO NOTHING;

-- Verify the data was inserted
SELECT 'Projects inserted:' as info, COUNT(*) as count FROM projects;
SELECT 'Assignments inserted:' as info, COUNT(*) as count FROM assignments;
