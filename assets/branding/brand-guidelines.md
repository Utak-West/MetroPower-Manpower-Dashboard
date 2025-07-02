# MetroPower Brand Guidelines - Dashboard Implementation

## Overview
Complete branding specifications for implementing MetroPower visual identity throughout the Noloco dashboard interface.

## Logo Usage

### Primary Logo
- **File Location**: `/Users/utakwest/Desktop/2024+MPI+LOGO_COLOR.png`
- **Usage**: Main header, login page, reports
- **Background**: Works on white and dark backgrounds
- **Minimum Size**: 120px width for web use
- **Maximum Size**: 400px width

### Logo Variations Needed
1. **Header Logo**: 40px height for dashboard header
2. **Favicon**: 32x32px for browser tab icon
3. **Mobile Logo**: Horizontal version for mobile header
4. **Report Logo**: High-resolution for PDF exports

### Logo Implementation in Noloco
```html
<!-- Dashboard Header Logo -->
<img src="[UPLOAD_LOGO_URL]" alt="MetroPower" style="height: 40px; margin-right: 15px; border-radius: 8px;">

<!-- Login Page Logo -->
<img src="[UPLOAD_LOGO_URL]" alt="MetroPower" style="height: 80px; margin-bottom: 20px;">

<!-- Report Header Logo -->
<img src="[UPLOAD_LOGO_URL]" alt="MetroPower" style="height: 60px;">
```

## Color Palette

### Primary Colors
```css
/* MetroPower Blue - Primary Brand Color */
--primary-color: #1e3a8a;
--primary-hover: #1e40af;
--primary-light: #3b82f6;
--primary-dark: #1e293b;

/* Accent Orange - Secondary Brand Color */
--secondary-color: #f59e0b;
--secondary-hover: #d97706;
--secondary-light: #fbbf24;
--secondary-dark: #92400e;
```

### Supporting Colors
```css
/* Background Colors */
--background-primary: #ffffff;
--background-secondary: #f8fafc;
--background-tertiary: #f1f5f9;

/* Text Colors */
--text-primary: #1f2937;
--text-secondary: #6b7280;
--text-light: #9ca3af;
--text-white: #ffffff;

/* Status Colors */
--success-color: #10b981;
--warning-color: #f59e0b;
--error-color: #ef4444;
--info-color: #3b82f6;

/* Border Colors */
--border-light: #e5e7eb;
--border-medium: #d1d5db;
--border-dark: #9ca3af;
```

### Color Usage Guidelines
- **Primary Blue (#1e3a8a)**: Headers, primary buttons, navigation, key UI elements
- **Accent Orange (#f59e0b)**: Call-to-action buttons, highlights, warnings
- **Success Green (#10b981)**: Completed tasks, active status, positive metrics
- **Error Red (#ef4444)**: Alerts, errors, critical status
- **Background Gray (#f8fafc)**: Page backgrounds, card backgrounds

## Typography

### Font Family
```css
/* Primary Font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Fallback Fonts */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Font Sizes and Weights
```css
/* Headers */
--font-size-h1: 32px; /* Page titles */
--font-size-h2: 24px; /* Section headers */
--font-size-h3: 20px; /* Subsection headers */
--font-size-h4: 18px; /* Card titles */

/* Body Text */
--font-size-base: 16px; /* Default body text */
--font-size-sm: 14px; /* Small text, labels */
--font-size-xs: 12px; /* Captions, footnotes */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Typography Implementation
```css
/* Dashboard Header */
h1.dashboard-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Page Headers */
h2.page-header {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

/* Card Titles */
h3.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

/* Body Text */
p.body-text {
  font-size: 16px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.5;
}

/* Small Text */
span.small-text {
  font-size: 14px;
  font-weight: 400;
  color: #9ca3af;
}
```

## Component Styling

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background-color: #1e3a8a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 58, 138, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background-color: #f59e0b;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #d97706;
  transform: translateY(-1px);
}

/* Outline Button */
.btn-outline {
  background-color: transparent;
  color: #1e3a8a;
  border: 2px solid #1e3a8a;
  border-radius: 8px;
  padding: 10px 22px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background-color: #1e3a8a;
  color: #ffffff;
}
```

### Card Styles
```css
/* Standard Card */
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

/* Metric Card */
.metric-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #1e3a8a;
  transition: all 0.2s ease;
}

/* Employee Card */
.employee-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.employee-card:hover {
  border-color: #1e3a8a;
  box-shadow: 0 4px 8px rgba(30, 58, 138, 0.1);
}
```

### Status Badges
```css
/* Active Status */
.badge-active {
  background-color: #10b981;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

/* Inactive Status */
.badge-inactive {
  background-color: #ef4444;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

/* In Progress Status */
.badge-progress {
  background-color: #3b82f6;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

/* Warning Status */
.badge-warning {
  background-color: #f59e0b;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}
```

## Layout Guidelines

### Header Layout
```css
/* Dashboard Header */
.dashboard-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  color: #ffffff;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Mobile Header */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 15px;
    flex-direction: column;
    text-align: center;
  }
}
```

### Grid Layout
```css
/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

/* Employee Grid */
.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* Project Grid */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}
```

### Spacing System
```css
/* Spacing Variables */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;

/* Component Spacing */
.component-spacing {
  margin-bottom: var(--spacing-lg);
}

.section-spacing {
  margin-bottom: var(--spacing-xl);
}

.page-spacing {
  margin-bottom: var(--spacing-2xl);
}
```

## Mobile Responsiveness

### Breakpoints
```css
/* Mobile First Approach */
/* Mobile: 320px - 768px */
/* Tablet: 768px - 1024px */
/* Desktop: 1024px+ */

@media (max-width: 768px) {
  /* Mobile Styles */
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .employee-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header h1 {
    font-size: 20px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet Styles */
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .employee-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## Implementation Checklist

### Noloco Configuration
- [ ] Upload MetroPower logo to Noloco assets
- [ ] Set primary color to #1e3a8a
- [ ] Set secondary color to #f59e0b
- [ ] Configure Inter font family
- [ ] Apply custom CSS for components

### Component Branding
- [ ] Header component with MetroPower logo and colors
- [ ] Statistics cards with brand colors
- [ ] Employee cards with consistent styling
- [ ] Project cards with brand elements
- [ ] Buttons using brand color scheme

### Mobile Optimization
- [ ] Test header on mobile devices
- [ ] Verify card layouts on tablets
- [ ] Check button sizes for touch interaction
- [ ] Validate text readability on small screens

### Brand Consistency
- [ ] All colors match brand guidelines
- [ ] Typography is consistent throughout
- [ ] Logo usage follows guidelines
- [ ] Status badges use appropriate colors
- [ ] Spacing follows design system

## Tucker Branch Identification

### Location Branding
```html
<!-- Header Subtitle -->
<p style="margin: 0; opacity: 0.9; font-size: 14px;">Tucker Branch - Workforce Management</p>

<!-- Footer Location -->
<p style="margin: 0;">&copy; 2025 MetroPower - Tucker Branch</p>

<!-- Page Headers -->
<h2>Staff Management - Tucker Branch</h2>
<h2>Project Management - Tucker Branch</h2>
```

### Contact Information
```
Primary Contact: Antione Harrell
Email: antione.harrell@metropower.com
Location: Tucker Branch
Address: [Tucker Branch Address]
Phone: [Tucker Branch Phone]
```

This branding guide ensures consistent MetroPower visual identity throughout the dashboard while maintaining professional appearance and usability.
