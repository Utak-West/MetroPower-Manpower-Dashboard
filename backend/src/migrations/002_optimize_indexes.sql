-- MetroPower Manpower Dashboard - Database Optimization
-- Migration 002: Add optimized indexes for better query performance

-- Additional indexes for assignments table based on common query patterns
CREATE INDEX IF NOT EXISTS idx_assignments_date_project ON assignments(assignment_date, project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date_employee ON assignments(assignment_date, employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_date ON assignments(project_id, assignment_date);

-- Composite index for the most common assignment query pattern (date range + joins)
CREATE INDEX IF NOT EXISTS idx_assignments_date_emp_proj ON assignments(assignment_date, employee_id, project_id);

-- Index for assignment conflict checking (double-booking prevention)
CREATE INDEX IF NOT EXISTS idx_assignments_emp_date_unique ON assignments(employee_id, assignment_date) WHERE assignment_date IS NOT NULL;

-- Indexes for employee search functionality
CREATE INDEX IF NOT EXISTS idx_employees_search_name ON employees USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_employees_search_number ON employees(employee_number) WHERE employee_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_active_status ON employees(status) WHERE status = 'Active';

-- Indexes for project queries
CREATE INDEX IF NOT EXISTS idx_projects_active_status ON projects(status) WHERE status = 'Active';
CREATE INDEX IF NOT EXISTS idx_projects_date_range ON projects(start_date, end_date) WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

-- Indexes for assignment history queries
CREATE INDEX IF NOT EXISTS idx_assignment_history_emp_date ON assignment_history(employee_id, assignment_date);
CREATE INDEX IF NOT EXISTS idx_assignment_history_changed_at_desc ON assignment_history(changed_at DESC);

-- Indexes for user authentication and session management
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login) WHERE last_login IS NOT NULL;

-- Indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, read_status) WHERE read_status = false;
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at_desc ON notifications(sent_at DESC);

-- Indexes for export tracking
CREATE INDEX IF NOT EXISTS idx_exports_user_status ON exports(user_id, status);
CREATE INDEX IF NOT EXISTS idx_exports_created_desc ON exports(created_at DESC);

-- Partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_assignments_current_week ON assignments(assignment_date) 
WHERE assignment_date >= CURRENT_DATE - INTERVAL '7 days' AND assignment_date <= CURRENT_DATE + INTERVAL '7 days';

-- Index for weekly archive queries
CREATE INDEX IF NOT EXISTS idx_weekly_archives_week_start ON weekly_archives(week_start_date DESC);

-- Add statistics targets for better query planning
ALTER TABLE assignments ALTER COLUMN assignment_date SET STATISTICS 1000;
ALTER TABLE assignments ALTER COLUMN employee_id SET STATISTICS 1000;
ALTER TABLE assignments ALTER COLUMN project_id SET STATISTICS 1000;
ALTER TABLE employees ALTER COLUMN name SET STATISTICS 1000;
ALTER TABLE projects ALTER COLUMN name SET STATISTICS 1000;

-- Create materialized view for assignment summary statistics (optional, for reporting)
CREATE MATERIALIZED VIEW IF NOT EXISTS assignment_summary_stats AS
SELECT 
    DATE_TRUNC('week', assignment_date) as week_start,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT employee_id) as unique_employees,
    COUNT(DISTINCT project_id) as unique_projects
FROM assignments 
WHERE assignment_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('week', assignment_date)
ORDER BY week_start DESC;

-- Index on the materialized view
CREATE INDEX IF NOT EXISTS idx_assignment_summary_week ON assignment_summary_stats(week_start DESC);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_assignment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY assignment_summary_stats;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON INDEX idx_assignments_date_emp_proj IS 'Optimizes the main assignment query with date range and joins';
COMMENT ON INDEX idx_assignments_emp_date_unique IS 'Optimizes conflict checking for double-booking prevention';
COMMENT ON INDEX idx_employees_search_name IS 'Full-text search index for employee names';
COMMENT ON MATERIALIZED VIEW assignment_summary_stats IS 'Pre-computed assignment statistics for reporting dashboard';
