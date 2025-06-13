/**
 * Demo Data for MetroPower Dashboard
 *
 * This file contains mock data for demonstration purposes when no database is available.
 * Perfect for demos, development, and testing.
 */

// Demo Users
const demoUsers = [
  {
    user_id: 1,
    username: 'antione.harrell',
    email: 'antione.harrell@metropower.com',
    first_name: 'Antione',
    last_name: 'Harrell',
    role: 'Assistant Project Manager',
    branch: 'Tucker Branch',
    created_at: '2024-01-15T08:00:00Z',
    is_active: true
  },
  {
    user_id: 2,
    username: 'demo.admin',
    email: 'admin@metropower.com',
    first_name: 'Demo',
    last_name: 'Admin',
    role: 'Admin',
    branch: 'Tucker Branch',
    created_at: '2024-01-01T08:00:00Z',
    is_active: true
  }
]

// Demo Employees (Electricians)
const demoEmployees = [
  {
    employee_id: 1,
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@metropower.com',
    phone: '(555) 123-4567',
    position: 'Senior Electrician',
    branch: 'Tucker Branch',
    hire_date: '2022-03-15',
    hourly_rate: 28.50,
    skills: ['Residential Wiring', 'Commercial Installation', 'Troubleshooting'],
    certifications: ['Licensed Electrician', 'OSHA 30'],
    is_active: true,
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    employee_id: 2,
    first_name: 'Maria',
    last_name: 'Garcia',
    email: 'maria.garcia@metropower.com',
    phone: '(555) 234-5678',
    position: 'Electrician',
    branch: 'Tucker Branch',
    hire_date: '2023-01-20',
    hourly_rate: 24.00,
    skills: ['Residential Wiring', 'Panel Installation'],
    certifications: ['Licensed Electrician'],
    is_active: true,
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    employee_id: 3,
    first_name: 'David',
    last_name: 'Johnson',
    email: 'david.johnson@metropower.com',
    phone: '(555) 345-6789',
    position: 'Apprentice Electrician',
    branch: 'Tucker Branch',
    hire_date: '2023-08-10',
    hourly_rate: 18.00,
    skills: ['Basic Wiring', 'Tool Maintenance'],
    certifications: ['OSHA 10'],
    is_active: true,
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    employee_id: 4,
    first_name: 'Sarah',
    last_name: 'Williams',
    email: 'sarah.williams@metropower.com',
    phone: '(555) 456-7890',
    position: 'Senior Electrician',
    branch: 'Tucker Branch',
    hire_date: '2021-11-05',
    hourly_rate: 30.00,
    skills: ['Industrial Wiring', 'Motor Controls', 'PLC Programming'],
    certifications: ['Licensed Electrician', 'OSHA 30', 'PLC Certification'],
    is_active: true,
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    employee_id: 5,
    first_name: 'Michael',
    last_name: 'Brown',
    email: 'michael.brown@metropower.com',
    phone: '(555) 567-8901',
    position: 'Electrician',
    branch: 'Tucker Branch',
    hire_date: '2022-09-12',
    hourly_rate: 26.00,
    skills: ['Commercial Wiring', 'Lighting Systems', 'Emergency Repairs'],
    certifications: ['Licensed Electrician', 'OSHA 30'],
    is_active: true,
    created_at: '2024-01-15T08:00:00Z'
  }
]

// Demo Projects
const demoProjects = [
  {
    project_id: 1,
    name: 'Downtown Office Complex Renovation',
    description: 'Complete electrical renovation of 15-story office building',
    client: 'Metro Development Corp',
    location: '123 Main St, Atlanta, GA',
    start_date: '2024-06-01',
    end_date: '2024-08-30',
    status: 'Active',
    priority: 'High',
    estimated_hours: 2400,
    budget: 180000,
    project_manager_id: 1,
    created_at: '2024-05-15T08:00:00Z'
  },
  {
    project_id: 2,
    name: 'Residential Subdivision Phase 2',
    description: 'Electrical installation for 25 new homes',
    client: 'Sunrise Homes',
    location: 'Tucker Meadows Subdivision',
    start_date: '2024-06-15',
    end_date: '2024-09-15',
    status: 'Active',
    priority: 'Medium',
    estimated_hours: 1800,
    budget: 125000,
    project_manager_id: 1,
    created_at: '2024-05-20T08:00:00Z'
  },
  {
    project_id: 3,
    name: 'Shopping Center Lighting Upgrade',
    description: 'LED lighting conversion for entire shopping center',
    client: 'Tucker Plaza Management',
    location: '456 Tucker Rd, Tucker, GA',
    start_date: '2024-07-01',
    end_date: '2024-07-31',
    status: 'Planned',
    priority: 'Low',
    estimated_hours: 800,
    budget: 65000,
    project_manager_id: 1,
    created_at: '2024-06-01T08:00:00Z'
  }
]

// Demo Assignments
const demoAssignments = [
  {
    assignment_id: 1,
    employee_id: 1,
    project_id: 1,
    date: '2024-06-11',
    start_time: '08:00',
    end_time: '16:30',
    hours: 8.5,
    task_description: 'Main electrical panel installation - Floor 5',
    status: 'Assigned',
    notes: 'Bring panel installation tools',
    created_at: '2024-06-10T15:00:00Z',
    created_by: 1
  },
  {
    assignment_id: 2,
    employee_id: 2,
    project_id: 1,
    date: '2024-06-11',
    start_time: '08:00',
    end_time: '16:30',
    hours: 8.5,
    task_description: 'Outlet installation - Floor 3',
    status: 'Assigned',
    notes: 'Work with John on coordination',
    created_at: '2024-06-10T15:00:00Z',
    created_by: 1
  },
  {
    assignment_id: 3,
    employee_id: 4,
    project_id: 2,
    date: '2024-06-11',
    start_time: '07:30',
    end_time: '16:00',
    hours: 8.5,
    task_description: 'Rough wiring - Houses 15-18',
    status: 'Assigned',
    notes: 'Focus on kitchen and bathroom circuits',
    created_at: '2024-06-10T15:00:00Z',
    created_by: 1
  },
  {
    assignment_id: 4,
    employee_id: 5,
    project_id: 1,
    date: '2024-06-11',
    start_time: '09:00',
    end_time: '17:00',
    hours: 8.0,
    task_description: 'Emergency lighting system installation',
    status: 'Assigned',
    notes: 'Test all emergency circuits',
    created_at: '2024-06-10T15:00:00Z',
    created_by: 1
  },
  {
    assignment_id: 5,
    employee_id: 3,
    project_id: 2,
    date: '2024-06-11',
    start_time: '08:00',
    end_time: '16:30',
    hours: 8.5,
    task_description: 'Assist with rough wiring - Houses 15-18',
    status: 'Assigned',
    notes: 'Learning opportunity - work with Sarah',
    created_at: '2024-06-10T15:00:00Z',
    created_by: 1
  }
]

// Demo Notifications
const demoNotifications = [
  {
    notification_id: 1,
    recipient_id: 1,
    type: 'Assignment Change',
    subject: 'New Assignment Added',
    content: 'You have been assigned to Downtown Office Complex Renovation for June 11th',
    related_assignment_id: 1,
    read_status: false,
    sent_at: '2024-06-10T15:00:00Z',
    created_at: '2024-06-10T15:00:00Z'
  },
  {
    notification_id: 2,
    recipient_id: 1,
    type: 'Daily Summary',
    subject: 'Daily Assignment Summary - June 11th',
    content: '5 electricians assigned across 2 active projects',
    read_status: false,
    sent_at: '2024-06-11T06:00:00Z',
    created_at: '2024-06-11T06:00:00Z'
  }
]

module.exports = {
  demoUsers,
  demoEmployees,
  demoProjects,
  demoAssignments,
  demoNotifications
}
