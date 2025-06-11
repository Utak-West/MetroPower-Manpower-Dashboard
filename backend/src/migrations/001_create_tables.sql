-- MetroPower Manpower Dashboard - Database Schema Creation
-- Migration 001: Create all core tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE employee_status AS ENUM ('Active', 'PTO', 'Leave', 'Military', 'Terminated');
CREATE TYPE project_status AS ENUM ('Active', 'Completed', 'On Hold', 'Planned');
CREATE TYPE user_role AS ENUM ('Admin', 'Project Manager', 'Branch Manager', 'HR', 'View Only');
CREATE TYPE notification_type AS ENUM ('Assignment Change', 'Daily Summary', 'Exception Alert');
CREATE TYPE export_type AS ENUM ('Excel', 'CSV', 'Markdown', 'PDF');
CREATE TYPE export_status AS ENUM ('Pending', 'Completed', 'Failed');

-- 1. Positions/Trades Table
CREATE TABLE positions (
    position_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    color_code VARCHAR(7) NOT NULL DEFAULT '#000000',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL DEFAULT 'View Only',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Employees Table
CREATE TABLE employees (
    employee_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position_id INTEGER NOT NULL REFERENCES positions(position_id),
    status employee_status NOT NULL DEFAULT 'Active',
    employee_number VARCHAR(20) UNIQUE,
    hire_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Projects Table
CREATE TABLE projects (
    project_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    number VARCHAR(20) NOT NULL UNIQUE,
    status project_status NOT NULL DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    location VARCHAR(100),
    manager_id INTEGER REFERENCES users(user_id),
    description TEXT,
    budget DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Assignments Table
CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    employee_id VARCHAR(10) NOT NULL REFERENCES employees(employee_id),
    project_id VARCHAR(20) NOT NULL REFERENCES projects(project_id),
    assignment_date DATE NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(user_id),
    updated_by INTEGER REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent double-booking: one employee per day
    UNIQUE(employee_id, assignment_date)
);

-- 6. Assignment History Table
CREATE TABLE assignment_history (
    history_id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(assignment_id),
    employee_id VARCHAR(10) NOT NULL REFERENCES employees(employee_id),
    previous_project_id VARCHAR(20) REFERENCES projects(project_id),
    new_project_id VARCHAR(20) REFERENCES projects(project_id),
    assignment_date DATE NOT NULL,
    change_reason VARCHAR(255),
    changed_by INTEGER NOT NULL REFERENCES users(user_id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications Table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    type notification_type NOT NULL,
    recipient_id INTEGER NOT NULL REFERENCES users(user_id),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    related_assignment_id INTEGER REFERENCES assignments(assignment_id),
    read_status BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Exports Table
CREATE TABLE exports (
    export_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    type export_type NOT NULL,
    parameters JSONB,
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    status export_status NOT NULL DEFAULT 'Pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 9. Weekly Archives Table
CREATE TABLE weekly_archives (
    archive_id SERIAL PRIMARY KEY,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    archive_data JSONB NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique archives per week
    UNIQUE(week_start_date, week_end_date)
);

-- 10. User Preferences Table
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    preference_key VARCHAR(50) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique preferences per user
    UNIQUE(user_id, preference_key)
);

-- Create Indexes for Performance
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_name ON employees(name);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_number ON projects(number);

CREATE INDEX idx_assignments_employee ON assignments(employee_id);
CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_date ON assignments(assignment_date);
CREATE INDEX idx_assignments_employee_date ON assignments(employee_id, assignment_date);

CREATE INDEX idx_assignment_history_assignment ON assignment_history(assignment_id);
CREATE INDEX idx_assignment_history_employee ON assignment_history(employee_id);
CREATE INDEX idx_assignment_history_date ON assignment_history(changed_at);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read_status ON notifications(read_status);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE INDEX idx_exports_user ON exports(user_id);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_created ON exports(created_at);

CREATE INDEX idx_weekly_archives_dates ON weekly_archives(week_start_date, week_end_date);
CREATE INDEX idx_weekly_archives_created ON weekly_archives(created_at);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
