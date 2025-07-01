-- MetroPower Dashboard Database Setup for Vercel Postgres
-- Run this script after creating a Vercel Postgres database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'View Only',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    hire_date DATE,
    hourly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    client_name VARCHAR(200),
    project_address TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    hours_worked DECIMAL(5,2) DEFAULT 8.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, assignment_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project ON assignments(project_id);

-- Insert default admin user (password: MetroPower2025!)
-- Password hash generated with bcrypt rounds=12
INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES (
    'admin',
    'admin@metropower.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9PS',
    'Admin',
    'User',
    'Admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert Antione Harrell user (password: MetroPower2025!)
-- Password hash generated with bcrypt rounds=12
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES (
    'antione.harrell',
    'antione.harrell@metropower.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9PS',
    'Antione',
    'Harrell',
    'Project Manager'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample employees
INSERT INTO employees (first_name, last_name, position, phone, email, hire_date, hourly_rate) VALUES
('John', 'Smith', 'Electrician', '555-0101', 'john.smith@metropower.com', '2024-01-15', 28.50),
('Mike', 'Johnson', 'Apprentice Electrician', '555-0102', 'mike.johnson@metropower.com', '2024-02-01', 18.00),
('Sarah', 'Williams', 'Field Supervisor', '555-0103', 'sarah.williams@metropower.com', '2023-11-10', 32.00),
('David', 'Brown', 'Electrician', '555-0104', 'david.brown@metropower.com', '2024-01-20', 29.00),
('Lisa', 'Davis', 'Project Coordinator', '555-0105', 'lisa.davis@metropower.com', '2023-12-05', 25.00)
ON CONFLICT DO NOTHING;

-- Insert sample projects
INSERT INTO projects (project_name, client_name, project_address, start_date, end_date, status, description) VALUES
('Tucker Mall Renovation', 'Tucker Mall Management', '4166 Lavista Rd, Tucker, GA 30084', '2024-06-01', '2024-08-15', 'Active', 'Complete electrical renovation of Tucker Mall food court and common areas'),
('Office Complex Wiring', 'Northlake Business Park', '1234 Business Blvd, Tucker, GA 30084', '2024-06-10', '2024-07-30', 'Active', 'New construction electrical installation for 3-story office building'),
('Residential Development', 'Tucker Homes LLC', '5678 Residential Way, Tucker, GA 30084', '2024-05-15', '2024-09-01', 'Active', 'Electrical installation for 12-unit townhome development')
ON CONFLICT DO NOTHING;

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
