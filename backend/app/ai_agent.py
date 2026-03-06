"""
Auvora AI Agent - Intelligent Business Assistant for Education CRM
Uses OpenAI GPT-4 with function calling to query business data and provide insights.
"""

import os
import json
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from openai import OpenAI

# Initialize OpenAI client
client = None

def get_openai_client():
    global client
    if client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        client = OpenAI(api_key=api_key)
    return client

# System prompt that defines the AI agent's personality and capabilities
SYSTEM_PROMPT = """You are Auvora, an intelligent AI assistant for EPIC Prep Academy, a micro-school education CRM. You help school administrators, coaches (teachers), and parents manage their school operations.

Your personality:
- Professional yet warm and approachable
- Knowledgeable about education and school management
- Proactive in offering insights and suggestions
- Clear and concise in your responses
- Patient when explaining how to use the CRM
- Able to understand questions asked in many different ways

You have access to the following data through function calls:
- Students: enrollment, grades, attendance, learning progress (IXL for K-8, Acellus for 9-12)
- Families: contact info, billing status, payment history
- Staff: roles, assignments, contact info
- Scholarships: Step Up for Students (SUFS) tracking, claims, payments
- Events: school events, RSVPs, permission slips
- Incidents: behavioral and safety reports
- Leads: prospective families in the enrollment pipeline

When answering questions:
1. Use the available functions to get accurate, real-time data
2. Provide specific numbers and names when relevant
3. Offer actionable insights when appropriate
4. If you can't find information, say so clearly
5. Format responses clearly - use bullet points for lists, bold for emphasis
6. When users ask HOW to do something, provide step-by-step instructions
7. Understand that users may ask the same question in different ways

Remember: You're helping run a school. Be helpful, accurate, and supportive of the school's mission: "Educating Lions not Sheep"

=== COMPREHENSIVE CRM KNOWLEDGE BASE ===

You must be able to answer ANY question about how to use this CRM. Below is complete documentation of all features.

## ROLE-BASED ACCESS

The CRM has three user roles with different access levels:

### ADMIN (School Administrator)
Full access to all features. Can manage students, families, staff, billing, admissions, and all school operations.

### COACH/TEACHER
Access to their assigned rooms/classrooms, student information, gradebook, messaging, and can upload learning progress data.

### PARENT
Access to their children's information, billing, events, messaging with staff, and re-enrollment.

---

## ADMIN DASHBOARD FEATURES

### 1. Dashboard (Home)
**What it shows:** Overview of key metrics
- Total students (morning/afternoon sessions)
- Total families
- Billing status breakdown (Green=current, Yellow=warning, Red=overdue)
- Today's attendance (present, absent, tardy)
- Alerts (at-risk students, IXL behind, overdue families)
- Daily Bible verse

**How to access:** Click "Dashboard" in the top navigation

**Common questions users might ask:**
- "How do I see my school overview?" → Go to Dashboard
- "Where can I see attendance for today?" → Dashboard shows today's attendance
- "How many students do we have?" → Dashboard shows total students
- "Which families owe money?" → Click on the red billing count or go to Families & Finance

### 2. Students
**What it shows:** Complete student roster with filtering options
- Student list with name, grade, session, room
- Attendance counts (Present/Absent/Tardy)
- Grade flags (On track, Needs attention, Failing)
- Risk flags (None, Watch, At risk)
- IXL status

**How to access:** Click "Students" in the top navigation

**Features:**
- Click any student to see full details
- Use "Add Student" button to enroll new students
- Filter by grade, status, risk level
- View full student and family account by clicking student name

**Common questions:**
- "How do I add a new student?" → Click "Add Student" button on Students page
- "How do I see a student's grades?" → Click on student name, then view grades section
- "Where do I find at-risk students?" → Students page, filter by risk flag or click alert on Dashboard
- "How do I see attendance history?" → Click student name, view attendance section

### 3. Families & Finance
**What it shows:** Family accounts and billing management
- Family list with billing status
- Current balances
- Payment history
- SUFS scholarship tracking

**Sub-tabs:**
- **Families:** View all family accounts
- **Billing:** Payment records and invoices
- **SUFS Scholarships:** Step Up for Students scholarship management
- **SUFS Payment Queue:** Record bi-monthly scholarship payments

**How to record a SUFS payment:**
1. Go to Families & Finance → SUFS Payment Queue
2. Find the family in the queue
3. Click "Record Payment"
4. Enter payment details
5. Submit

**Common questions:**
- "How do I see who owes money?" → Families & Finance, filter by Red billing status
- "How do I record a scholarship payment?" → SUFS Payment Queue tab
- "Where do I see payment history?" → Click on family name, view billing section
- "How do I manage SUFS scholarships?" → SUFS Scholarships tab

### 4. Admissions
**What it shows:** Enrollment pipeline for prospective families
- Leads by stage (New Inquiry → Contacted → Tour Scheduled → Toured → Application Submitted → Accepted → Enrolled)
- Lead details and follow-up tracking

**How to access:** Click "Admissions" in the top navigation

**Common questions:**
- "How do I add a new lead?" → Admissions page, click "Add Lead"
- "Where do I see tour requests?" → Admissions, filter by "Tour Scheduled" stage
- "How do I track enrollment pipeline?" → Admissions shows all stages

### 5. Academics
**What it shows:** Academic management tools

**Sub-tabs:**
- **Standards Gradebook:** Grade tracking by learning standards
- **Learning Progress:** IXL (K-8) and Acellus (9-12) progress tracking
- **Import Progress:** Upload CSV files from IXL/Acellus

**How to import learning progress:**
1. Go to Academics → Import Progress
2. Select IXL or Acellus tab
3. Download template if needed
4. Upload your CSV export from the learning platform
5. System matches students by name and updates records

**Common questions:**
- "How do I upload IXL data?" → Academics → Import Progress → IXL tab
- "How do I see student grades?" → Academics → Standards Gradebook
- "Where do I track Acellus progress?" → Academics → Learning Progress

### 6. Student Support
**What it shows:** Special education and intervention tracking

**Sub-tabs:**
- **IEP/504:** Individual Education Plans and 504 accommodations
- **Interventions:** Academic and behavioral intervention tracking

**Common questions:**
- "Where do I manage IEPs?" → Student Support → IEP/504
- "How do I track interventions?" → Student Support → Interventions

### 7. Communications
**What it shows:** Messaging and announcements

**Sub-tabs:**
- **Direct Messages:** Send messages to specific parents or staff
- **Broadcasts & Automation:** Mass communications and automated alerts
- **Announcements:** School-wide announcements

**How to send a message:**
1. Go to Communications → Direct Messages
2. Click "New Message"
3. Select recipient type (Parent or Staff Member)
4. Select specific recipient from dropdown
5. Type message and send

**Common questions:**
- "How do I message a parent?" → Communications → Direct Messages → New Message
- "How do I send an announcement?" → Communications → Announcements
- "How do I set up automated messages?" → Communications → Broadcasts & Automation

### 8. Operations
**What it shows:** Day-to-day school operations

**Sub-tabs:**
- **Events:** School events calendar and management
- **Staff:** Staff directory and management
- **Fees & Products:** Manage enrollment fees, event fees, and store products
- **Enrollment Forms:** View submitted enrollment forms
- **Photos:** School photo gallery

**How to create an enrollment fee:**
1. Go to Operations → Fees & Products
2. Click "Create New"
3. Select category "Enrollment Fee"
4. Set the price
5. Save - this fee will automatically appear for parents during re-enrollment

**Common questions:**
- "How do I add a school event?" → Operations → Events → Add Event
- "How do I manage staff?" → Operations → Staff
- "How do I set the enrollment fee?" → Operations → Fees & Products
- "Where do I see enrollment form submissions?" → Operations → Enrollment Forms

### 9. Documents & Forms
**What it shows:** Document management

**Sub-tabs:**
- **Document Library:** Upload and organize school documents
- **Forms:** Manage forms for parents to complete

**Common questions:**
- "How do I upload a document?" → Documents & Forms → Document Library → Upload
- "Where do parents find forms?" → Documents & Forms → Forms

### 10. Analytics
**What it shows:** Advanced reporting and insights

**Sub-tabs:**
- **At-Risk Report:** Students flagged as at-risk
- **Advanced Analytics:** Detailed school performance metrics

**Common questions:**
- "How do I see at-risk students?" → Analytics → At-Risk Report
- "Where do I find school performance data?" → Analytics → Advanced Analytics

---

## COACH/TEACHER DASHBOARD FEATURES

### 1. My Rooms
**What it shows:** Assigned classrooms and students
- Room cards showing student count
- Student list for each room
- Quick attendance taking

**How to take attendance:**
1. Click on a room
2. Click "Take Attendance"
3. Mark each student as Present, Absent, or Tardy
4. Submit

**Common questions:**
- "How do I take attendance?" → My Rooms → Select room → Take Attendance
- "How do I see my students?" → My Rooms shows all assigned students
- "How do I view a student's full record?" → Click student name → View Full Student & Family Account

### 2. Gradebook
**What it shows:** Grade management for your students

**Common questions:**
- "How do I enter grades?" → Gradebook tab
- "How do I see student grades?" → Gradebook tab

### 3. Announcements
**What it shows:** School announcements you can create and view

### 4. Events
**What it shows:** School events calendar

### 5. Documents
**What it shows:** School documents

### 6. Photos
**What it shows:** School photo gallery

### 7. Messages
**What it shows:** Direct messaging with parents and other staff
- Inbox and Sent messages
- Unread message indicator (red badge on tab)

**How to message a parent:**
1. Click Messages tab
2. Click "New Message"
3. Select "Parent" as recipient type
4. Select specific parent from dropdown
5. Type and send message

**How to message another staff member:**
1. Click Messages tab
2. Click "New Message"
3. Select "Staff Member" as recipient type
4. Select staff member from dropdown
5. Type and send message

### 8. Incidents
**What it shows:** Behavioral and safety incident reports

**How to report an incident:**
1. Click Incidents tab
2. Click "Report Incident"
3. Fill in details (student, type, description, severity)
4. Submit

### 9. Health Records
**What it shows:** Student health information

### 10. Learning Progress
**What it shows:** IXL and Acellus progress import

**How to upload learning progress:**
1. Click Learning Progress tab
2. Click "Import Progress Data"
3. Select IXL or Acellus
4. Upload CSV file from the learning platform
5. System updates all student records automatically

**Common questions:**
- "How do I upload IXL scores?" → Learning Progress → Import Progress Data → IXL
- "How do I import Acellus data?" → Learning Progress → Import Progress Data → Acellus

---

## PARENT DASHBOARD FEATURES

### 1. My Children
**What it shows:** Overview of your children's progress
- Child selector (if multiple children)
- Grades summary
- Attendance summary
- Learning progress (IXL/Acellus)
- Re-enrollment status

**How to re-enroll your child:**
1. Scroll to Re-Enrollment section
2. Click "Re-Enroll for [Year]"
3. Payment modal opens with enrollment fee
4. Click "Pay" to process payment
5. Child is re-enrolled for next year

### 2. Billing
**What it shows:** Your family's billing information
- Current balance
- Payment history
- Tuition breakdown
- SUFS scholarship status (if applicable)

### 3. Events
**What it shows:** School events
- Upcoming events
- RSVP to events
- Permission slips

### 4. Documents
**What it shows:** School documents and forms to complete

### 5. Store
**What it shows:** School store for purchasing items

### 6. Photos
**What it shows:** School photo gallery

### 7. Messages
**What it shows:** Messages with school staff
- Inbox and Sent messages
- Unread message indicator

**How to message a teacher:**
1. Click Messages tab
2. Click "New Message"
3. Select staff member from dropdown
4. Type and send message

### 8. Health
**What it shows:** Your child's health records

### 9. Enrollment
**What it shows:** Enrollment forms and status

---

## COMMON TASKS - STEP BY STEP

### How to add a new student (Admin):
1. Go to Students page
2. Click "Add Student" button
3. Fill in student information (name, grade, session, room)
4. Add family information
5. Set funding source (Step-Up, Out-of-Pocket, or Mixed)
6. Submit

### How to record a payment (Admin):
1. Go to Families & Finance
2. Click on the family name
3. Click "Record Payment"
4. Enter payment amount and method
5. Submit

### How to send a school-wide announcement (Admin):
1. Go to Communications
2. Click Announcements tab
3. Click "New Announcement"
4. Enter title and message
5. Select audience (All, Parents, Staff)
6. Publish

### How to view a student's full record (Admin/Teacher):
1. Find the student in your list
2. Click on their name
3. Click "View Full Student & Family Account"
4. Navigate between student info, grades, attendance, and family account

### How to check billing status (Admin):
1. Go to Families & Finance
2. View billing status colors:
   - Green = Current (paid up)
   - Yellow = Warning (payment due soon)
   - Red = Overdue (past due)
3. Click on family for details

### How to track SUFS scholarship payments (Admin):
1. Go to Families & Finance
2. Click SUFS Payment Queue tab
3. View pending payments by period (Aug, Oct, Dec, Feb, Apr, Jun)
4. Click "Record Payment" when payment received

---

## UNDERSTANDING DIFFERENT QUESTION PHRASINGS

Users may ask the same question in many ways. Here are examples:

**Asking about students:**
- "How many students do we have?"
- "What's our enrollment?"
- "Show me the student count"
- "Total number of kids enrolled"

**Asking about at-risk students:**
- "Who are the at-risk students?"
- "Show me struggling students"
- "Which kids need help?"
- "Students with problems"
- "Who should I be worried about?"

**Asking about billing:**
- "Who owes money?"
- "Show me overdue accounts"
- "Which families haven't paid?"
- "Outstanding balances"
- "Red billing status families"

**Asking about attendance:**
- "How's attendance today?"
- "Who's absent?"
- "Show me attendance"
- "Who didn't come to school?"

**Asking how to do something:**
- "How do I..." / "How can I..." / "How to..."
- "Where do I..." / "Where can I..."
- "Can you show me how to..."
- "What's the process for..."
- "Walk me through..."
- "Help me with..."

Always interpret the user's intent and provide helpful guidance, whether they're asking for data or instructions.

=== END OF KNOWLEDGE BASE ===
"""

# Define the functions the AI can call
AVAILABLE_FUNCTIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_dashboard_summary",
            "description": "Get a summary of key metrics for the school dashboard including total students, attendance rate, billing status, and alerts",
            "parameters": {
                "type": "object",
                "properties": {
                    "campus_id": {
                        "type": "string",
                        "description": "Optional campus ID to filter by specific campus"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_students",
            "description": "Search for students by various criteria like name, grade, status, attendance issues, grade issues, or risk flags",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Student name to search for (partial match)"
                    },
                    "grade": {
                        "type": "string",
                        "description": "Grade level (K, 1, 2, ... 12)"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["Active", "Waitlisted", "Withdrawn"],
                        "description": "Student enrollment status"
                    },
                    "has_attendance_issues": {
                        "type": "boolean",
                        "description": "Filter for students with more than 3 absences"
                    },
                    "has_grade_issues": {
                        "type": "boolean",
                        "description": "Filter for students with failing or needs attention grades"
                    },
                    "is_at_risk": {
                        "type": "boolean",
                        "description": "Filter for students flagged as at-risk"
                    },
                    "funding_source": {
                        "type": "string",
                        "enum": ["Step-Up", "Out-of-Pocket", "Mixed"],
                        "description": "Filter by funding source"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_student_details",
            "description": "Get detailed information about a specific student including grades, attendance, behavior notes, and learning progress",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_id": {
                        "type": "string",
                        "description": "The student's ID"
                    },
                    "student_name": {
                        "type": "string",
                        "description": "The student's name (will search if ID not provided)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_families",
            "description": "Search for families by name or billing status",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Family name to search for"
                    },
                    "billing_status": {
                        "type": "string",
                        "enum": ["Green", "Yellow", "Red"],
                        "description": "Filter by billing status (Green=current, Yellow=warning, Red=overdue)"
                    },
                    "min_balance": {
                        "type": "number",
                        "description": "Minimum outstanding balance"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_family_details",
            "description": "Get detailed information about a family including students, billing history, and scholarship info",
            "parameters": {
                "type": "object",
                "properties": {
                    "family_id": {
                        "type": "string",
                        "description": "The family's ID"
                    },
                    "family_name": {
                        "type": "string",
                        "description": "The family's name (will search if ID not provided)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_billing_summary",
            "description": "Get billing and revenue summary including total revenue, outstanding balances, and payment trends",
            "parameters": {
                "type": "object",
                "properties": {
                    "period": {
                        "type": "string",
                        "description": "Time period: 'today', 'this_week', 'this_month', 'this_year'"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_scholarship_summary",
            "description": "Get Step Up for Students scholarship summary including total awards, claims, and payments",
            "parameters": {
                "type": "object",
                "properties": {
                    "include_pending_claims": {
                        "type": "boolean",
                        "description": "Include details of pending claims"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_attendance_report",
            "description": "Get attendance statistics and identify students with attendance concerns",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "Specific date (YYYY-MM-DD) or 'today', 'yesterday', 'this_week'"
                    },
                    "show_concerns_only": {
                        "type": "boolean",
                        "description": "Only show students with attendance concerns"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_learning_progress_report",
            "description": "Get learning progress report for IXL (K-8) and Acellus (9-12) platforms",
            "parameters": {
                "type": "object",
                "properties": {
                    "platform": {
                        "type": "string",
                        "enum": ["IXL", "Acellus", "all"],
                        "description": "Which learning platform to report on"
                    },
                    "show_concerns_only": {
                        "type": "boolean",
                        "description": "Only show students who need attention"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_staff_list",
            "description": "Get list of staff members with their roles and assignments",
            "parameters": {
                "type": "object",
                "properties": {
                    "role": {
                        "type": "string",
                        "enum": ["Owner", "Director", "Manager", "Admin", "Teacher", "Assistant"],
                        "description": "Filter by staff role"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_leads_pipeline",
            "description": "Get enrollment leads pipeline with counts by stage",
            "parameters": {
                "type": "object",
                "properties": {
                    "stage": {
                        "type": "string",
                        "enum": ["New Inquiry", "Contacted", "Tour Scheduled", "Toured", "Application Submitted", "Accepted", "Enrolled", "Lost"],
                        "description": "Filter by pipeline stage"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_events",
            "description": "Get upcoming school events and their RSVP status",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_ahead": {
                        "type": "integer",
                        "description": "Number of days to look ahead (default 30)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_incidents",
            "description": "Get recent incident reports",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_back": {
                        "type": "integer",
                        "description": "Number of days to look back (default 7)"
                    },
                    "severity": {
                        "type": "string",
                        "enum": ["Low", "Medium", "High"],
                        "description": "Filter by severity level"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function", 
        "function": {
            "name": "get_re_enrollment_status",
            "description": "Get re-enrollment status for the upcoming school year",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_export_report",
            "description": "Create a downloadable report file (spreadsheet or document) with data from the CRM. Use this when the user asks for a report, spreadsheet, CSV, Excel file, PDF, or downloadable document. Available datasets: students, families, billing_records, scholarships, attendance, staff, leads.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dataset": {
                        "type": "string",
                        "enum": ["students", "families", "billing_records", "scholarships", "attendance", "staff", "leads"],
                        "description": "The dataset to export"
                    },
                    "format": {
                        "type": "string",
                        "enum": ["csv", "xlsx", "pdf"],
                        "description": "Output format: csv (spreadsheet), xlsx (Excel), or pdf (document)"
                    },
                    "title": {
                        "type": "string",
                        "description": "Title for the report (e.g., 'Student Roster', 'Outstanding Balances Report')"
                    },
                    "columns": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific columns to include. For students: student_id, first_name, last_name, grade, status, funding_source, attendance_present_count, attendance_absent_count, attendance_tardy_count, overall_grade_flag, overall_risk_flag, ixl_status_flag. For families: family_id, family_name, billing_status, current_balance, annual_tuition, primary_email, primary_phone. For billing_records: billing_record_id, family_id, date, type, description, amount, source. For scholarships: scholarship_id, student_id, family_id, scholarship_type, status, annual_award_amount, remaining_balance. For attendance: attendance_id, student_id, date, status, check_in_time, check_out_time. For staff: staff_id, first_name, last_name, role, email, phone, status. For leads: lead_id, parent_name, student_name, grade_interest, stage, source, created_date."
                    },
                    "filters": {
                        "type": "object",
                        "description": "Optional filters to apply (e.g., {\"billing_status\": \"Red\"} for families with overdue balances)"
                    },
                    "sort_by": {
                        "type": "string",
                        "description": "Column to sort by"
                    },
                    "sort_order": {
                        "type": "string",
                        "enum": ["asc", "desc"],
                        "description": "Sort order (ascending or descending)"
                    }
                },
                "required": ["dataset", "format", "title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_crm_help",
            "description": "Get help and guidance on how to use the CRM. Use this when users ask 'how do I', 'where do I', 'help me with', 'walk me through', or any question about using the CRM features.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or feature the user needs help with (e.g., 'add student', 'record payment', 'take attendance', 'send message', 'upload IXL', 're-enroll')"
                    },
                    "user_role": {
                        "type": "string",
                        "enum": ["admin", "teacher", "parent"],
                        "description": "The role of the user asking for help"
                    }
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_features",
            "description": "Get a list of all available features for a specific user role. Use this when users ask 'what can I do', 'what features are available', 'show me the menu', or want to know their options.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_role": {
                        "type": "string",
                        "enum": ["admin", "teacher", "parent"],
                        "description": "The role of the user"
                    }
                },
                "required": ["user_role"]
            }
        }
    }
]

# Functions that are restricted by role
# Parents should NOT have access to these functions
PARENT_RESTRICTED_FUNCTIONS = {
    "get_dashboard_summary",      # School-wide summary with financials
    "search_students",            # Can search ANY student
    "get_student_details",        # Can view ANY student details
    "search_families",            # Can search ANY family
    "get_family_details",         # Can view ANY family details
    "get_billing_summary",        # School-wide billing/financial data
    "get_scholarship_summary",    # School-wide scholarship data
    "get_staff_list",             # Staff directory with sensitive info
    "get_leads_pipeline",         # Enrollment pipeline (business data)
    "get_recent_incidents",       # All incident reports
    "get_re_enrollment_status",   # School-wide re-enrollment stats
    "create_export_report",       # Can export any dataset
}

# Teachers should NOT have access to these functions
TEACHER_RESTRICTED_FUNCTIONS = {
    "get_billing_summary",        # Financial data
    "get_scholarship_summary",    # Scholarship financial data
    "get_leads_pipeline",         # Enrollment pipeline (business data)
    "get_re_enrollment_status",   # School-wide re-enrollment stats
    "create_export_report",       # Can export sensitive datasets
}

# Role-specific system prompt additions
ROLE_PROMPTS = {
    "admin": """
You are speaking with a SCHOOL ADMINISTRATOR who has FULL ACCESS to all school data and operations.
You may share any information requested including student data, family details, billing, scholarships, leads, staff info, and all operational data.
""",
    "teacher": """
You are speaking with a TEACHER/COACH. Their access is LIMITED to:
- Student academic information (grades, attendance, learning progress)
- Classroom and student support data
- School events and announcements
- Messaging

You must NOT share or discuss:
- Financial information (billing, tuition, balances, payment plans)
- Scholarship details or amounts
- Enrollment pipeline or leads data
- Re-enrollment statistics
- Detailed family financial status
- Staff salary or HR information

If a teacher asks about restricted topics, politely explain that this information is only available to administrators.
""",
    "parent": """
You are speaking with a PARENT. Their access is VERY LIMITED:
- They can ONLY ask about general school events, announcements, and school policies
- They can ask for help using the parent features of the CRM (messaging, viewing their child's info, re-enrollment)
- They can ask general questions about the school

You must NEVER share or discuss:
- Information about OTHER students or families (names, grades, attendance, behavior)
- Total student counts, enrollment numbers, or class sizes
- School financial data (revenue, billing summaries, outstanding balances)
- Scholarship program details or amounts for other families
- Staff information beyond publicly available names
- Enrollment pipeline or leads data
- Incident reports about other students
- Any aggregate school performance data
- Business operations information

If a parent asks about school-wide data, other families, financial information, or anything beyond their own family's scope, politely respond:
"I'm sorry, but I can only help you with information about your own family's account. For school-wide questions, please contact the school administrator directly."

IMPORTANT: Even if the parent phrases the question indirectly (e.g., "How many students go here?", "What's the school's revenue?", "Tell me about the Smith family"), you must decline to share that information.
"""
}


def get_functions_for_role(user_role: str) -> list:
    """Return the list of available functions filtered by user role."""
    if user_role == "admin":
        return AVAILABLE_FUNCTIONS
    
    if user_role == "teacher":
        restricted = TEACHER_RESTRICTED_FUNCTIONS
    elif user_role == "parent":
        restricted = PARENT_RESTRICTED_FUNCTIONS
    else:
        restricted = PARENT_RESTRICTED_FUNCTIONS  # Default to most restrictive
    
    return [
        func for func in AVAILABLE_FUNCTIONS
        if func["function"]["name"] not in restricted
    ]


def filter_data_context_by_role(data_context: dict, user_role: str) -> dict:
    """Filter the data context based on the user's role to prevent data leaks."""
    if user_role == "admin":
        return data_context  # Admins get full access
    
    if user_role == "teacher":
        # Teachers can see students, attendance, grades, behavior, events
        # but NOT billing, scholarships, leads, or detailed family financials
        filtered = dict(data_context)
        filtered.pop("billing_records", None)
        filtered.pop("leads", None)
        filtered.pop("sufs_scholarships", None)
        filtered.pop("sufs_claims", None)
        filtered.pop("sufs_payments", None)
        return filtered
    
    if user_role == "parent":
        # Parents get almost no data context - the AI should use the role prompt
        # to decline requests. We only keep events (public info) and empty lists
        # for everything else so function calls return empty results
        return {
            "students": [],
            "families": [],
            "parents": [],
            "staff": [],
            "billing_records": [],
            "attendance_records": [],
            "ixl_summaries": [],
            "acellus_summaries": [],
            "acellus_courses": [],
            "grade_records": [],
            "behavior_notes": [],
            "events": data_context.get("events", []),  # Events are public
            "incidents": [],
            "leads": [],
            "sufs_scholarships": [],
            "sufs_claims": [],
            "sufs_payments": [],
        }
    
    # Default: most restrictive (same as parent)
    return filter_data_context_by_role(data_context, "parent")


def execute_function(function_name: str, arguments: dict, data_context: dict) -> dict:
    """Execute a function call and return the results"""
    
    students_db = data_context.get("students", [])
    families_db = data_context.get("families", [])
    parents_db = data_context.get("parents", [])
    staff_db = data_context.get("staff", [])
    billing_records_db = data_context.get("billing_records", [])
    attendance_records_db = data_context.get("attendance_records", [])
    ixl_summaries_db = data_context.get("ixl_summaries", [])
    acellus_summaries_db = data_context.get("acellus_summaries", [])
    acellus_courses_db = data_context.get("acellus_courses", [])
    grade_records_db = data_context.get("grade_records", [])
    behavior_notes_db = data_context.get("behavior_notes", [])
    events_db = data_context.get("events", [])
    incidents_db = data_context.get("incidents", [])
    leads_db = data_context.get("leads", [])
    sufs_scholarships_db = data_context.get("sufs_scholarships", [])
    sufs_claims_db = data_context.get("sufs_claims", [])
    sufs_payments_db = data_context.get("sufs_payments", [])
    
    if function_name == "get_dashboard_summary":
        total_students = len([s for s in students_db if s.status.value == "Active"])
        total_families = len(families_db)
        
        # Attendance rate (last 20 school days)
        recent_attendance = [a for a in attendance_records_db if a.date >= date.today() - timedelta(days=30)]
        if recent_attendance:
            present_count = len([a for a in recent_attendance if a.status.value == "Present"])
            attendance_rate = round(present_count / len(recent_attendance) * 100, 1)
        else:
            attendance_rate = 0
        
        # Billing status counts
        billing_green = len([f for f in families_db if f.billing_status.value == "Green"])
        billing_yellow = len([f for f in families_db if f.billing_status.value == "Yellow"])
        billing_red = len([f for f in families_db if f.billing_status.value == "Red"])
        
        # At-risk students
        at_risk_count = len([s for s in students_db if s.overall_risk_flag.value == "At risk"])
        
        # Students needing attention (grades or IXL)
        needs_attention = len([s for s in students_db if s.overall_grade_flag.value != "On track" or s.ixl_status_flag.value == "Needs attention"])
        
        return {
            "total_students": total_students,
            "total_families": total_families,
            "attendance_rate": f"{attendance_rate}%",
            "billing_status": {
                "green": billing_green,
                "yellow": billing_yellow,
                "red": billing_red
            },
            "at_risk_students": at_risk_count,
            "students_needing_attention": needs_attention,
            "total_staff": len(staff_db)
        }
    
    elif function_name == "search_students":
        results = list(students_db)
        
        if arguments.get("name"):
            name_lower = arguments["name"].lower()
            results = [s for s in results if name_lower in s.first_name.lower() or name_lower in s.last_name.lower()]
        
        if arguments.get("grade"):
            results = [s for s in results if s.grade == arguments["grade"]]
        
        if arguments.get("status"):
            results = [s for s in results if s.status.value == arguments["status"]]
        
        if arguments.get("has_attendance_issues"):
            results = [s for s in results if s.attendance_absent_count > 3]
        
        if arguments.get("has_grade_issues"):
            results = [s for s in results if s.overall_grade_flag.value in ["Needs attention", "Failing"]]
        
        if arguments.get("is_at_risk"):
            results = [s for s in results if s.overall_risk_flag.value == "At risk"]
        
        if arguments.get("funding_source"):
            results = [s for s in results if s.funding_source.value == arguments["funding_source"]]
        
        return {
            "count": len(results),
            "students": [
                {
                    "id": s.student_id,
                    "name": f"{s.first_name} {s.last_name}",
                    "grade": s.grade,
                    "status": s.status.value,
                    "attendance": f"{s.attendance_present_count}P / {s.attendance_absent_count}A / {s.attendance_tardy_count}T",
                    "grade_flag": s.overall_grade_flag.value,
                    "risk_flag": s.overall_risk_flag.value,
                    "funding": s.funding_source.value
                }
                for s in results[:20]  # Limit to 20 results
            ]
        }
    
    elif function_name == "get_student_details":
        student = None
        
        if arguments.get("student_id"):
            student = next((s for s in students_db if s.student_id == arguments["student_id"]), None)
        elif arguments.get("student_name"):
            name_lower = arguments["student_name"].lower()
            student = next((s for s in students_db if name_lower in f"{s.first_name} {s.last_name}".lower()), None)
        
        if not student:
            return {"error": "Student not found"}
        
        # Get family
        family = next((f for f in families_db if f.family_id == student.family_id), None)
        
        # Get grades
        grades = [g for g in grade_records_db if g.student_id == student.student_id]
        
        # Get behavior notes
        notes = [n for n in behavior_notes_db if n.student_id == student.student_id]
        
        # Get IXL or Acellus data based on grade
        learning_data = None
        if student.grade in ["K", "1", "2", "3", "4", "5", "6", "7", "8"]:
            ixl = next((i for i in ixl_summaries_db if i.student_id == student.student_id), None)
            if ixl:
                learning_data = {
                    "platform": "IXL",
                    "weekly_hours": ixl.weekly_hours,
                    "skills_mastered": ixl.skills_mastered_total,
                    "math_status": ixl.math_proficiency.value,
                    "ela_status": ixl.ela_proficiency.value,
                    "last_active": str(ixl.last_active_date)
                }
        else:
            acellus = next((a for a in acellus_summaries_db if a.student_id == student.student_id), None)
            if acellus:
                learning_data = {
                    "platform": "Acellus",
                    "total_courses": acellus.total_courses,
                    "courses_on_track": acellus.courses_on_track,
                    "courses_behind": acellus.courses_behind,
                    "overall_gpa": acellus.overall_gpa,
                    "status": acellus.overall_status.value
                }
        
        # Get scholarship info
        scholarship = next((s for s in sufs_scholarships_db if s.student_id == student.student_id), None)
        
        return {
            "student": {
                "id": student.student_id,
                "name": f"{student.first_name} {student.last_name}",
                "grade": student.grade,
                "date_of_birth": str(student.date_of_birth),
                "session": student.session.value,
                "room": student.room.value,
                "status": student.status.value,
                "enrollment_start": str(student.enrollment_start_date)
            },
            "attendance": {
                "present": student.attendance_present_count,
                "absent": student.attendance_absent_count,
                "tardy": student.attendance_tardy_count
            },
            "academics": {
                "overall_flag": student.overall_grade_flag.value,
                "grades": [{"subject": g.subject, "grade": g.grade_value} for g in grades]
            },
            "risk_flag": student.overall_risk_flag.value,
            "learning_progress": learning_data,
            "behavior_notes": [
                {"date": str(n.date), "type": n.type.value, "summary": n.summary}
                for n in notes[-5:]  # Last 5 notes
            ],
            "family": {
                "name": family.family_name if family else "Unknown",
                "billing_status": family.billing_status.value if family else "Unknown",
                "balance": family.current_balance if family else 0
            },
            "scholarship": {
                "has_scholarship": scholarship is not None,
                "type": scholarship.scholarship_type.value if scholarship else None,
                "annual_amount": scholarship.annual_award_amount if scholarship else 0,
                "remaining": scholarship.remaining_balance if scholarship else 0
            } if scholarship else None,
            "funding_source": student.funding_source.value,
            "step_up_percentage": student.step_up_percentage
        }
    
    elif function_name == "search_families":
        results = list(families_db)
        
        if arguments.get("name"):
            name_lower = arguments["name"].lower()
            results = [f for f in results if name_lower in f.family_name.lower()]
        
        if arguments.get("billing_status"):
            results = [f for f in results if f.billing_status.value == arguments["billing_status"]]
        
        if arguments.get("min_balance"):
            results = [f for f in results if f.current_balance >= arguments["min_balance"]]
        
        return {
            "count": len(results),
            "families": [
                {
                    "id": f.family_id,
                    "name": f.family_name,
                    "num_students": len(f.student_ids),
                    "billing_status": f.billing_status.value,
                    "balance": round(f.current_balance, 2),
                    "monthly_tuition": round(f.monthly_tuition_amount, 2)
                }
                for f in results[:20]
            ]
        }
    
    elif function_name == "get_family_details":
        family = None
        
        if arguments.get("family_id"):
            family = next((f for f in families_db if f.family_id == arguments["family_id"]), None)
        elif arguments.get("family_name"):
            name_lower = arguments["family_name"].lower()
            family = next((f for f in families_db if name_lower in f.family_name.lower()), None)
        
        if not family:
            return {"error": "Family not found"}
        
        # Get students
        students = [s for s in students_db if s.student_id in family.student_ids]
        
        # Get parents
        parents = [p for p in parents_db if p.parent_id in family.parent_ids]
        
        # Get billing records
        billing = [b for b in billing_records_db if b.family_id == family.family_id]
        
        # Get scholarships for family
        scholarships = [s for s in sufs_scholarships_db if s.family_id == family.family_id]
        
        return {
            "family": {
                "id": family.family_id,
                "name": family.family_name,
                "billing_status": family.billing_status.value,
                "current_balance": round(family.current_balance, 2),
                "monthly_tuition": round(family.monthly_tuition_amount, 2),
                "last_payment_date": str(family.last_payment_date) if family.last_payment_date else None,
                "last_payment_amount": family.last_payment_amount
            },
            "students": [
                {
                    "id": s.student_id,
                    "name": f"{s.first_name} {s.last_name}",
                    "grade": s.grade,
                    "status": s.status.value,
                    "funding": s.funding_source.value
                }
                for s in students
            ],
            "parents": [
                {
                    "name": f"{p.first_name} {p.last_name}",
                    "email": p.email,
                    "phone": p.phone,
                    "relationship": p.relationship,
                    "primary": p.primary_guardian
                }
                for p in parents
            ],
            "scholarships": [
                {
                    "student_id": s.student_id,
                    "type": s.scholarship_type.value,
                    "annual_amount": s.annual_award_amount,
                    "remaining": s.remaining_balance
                }
                for s in scholarships
            ],
            "recent_billing": [
                {
                    "date": str(b.date),
                    "type": b.type,
                    "description": b.description,
                    "amount": b.amount,
                    "source": b.source.value if b.source else None
                }
                for b in sorted(billing, key=lambda x: x.date, reverse=True)[:10]
            ]
        }
    
    elif function_name == "get_billing_summary":
        total_families = len(families_db)
        total_outstanding = sum(f.current_balance for f in families_db)
        
        # Calculate expected monthly revenue
        expected_monthly = sum(f.monthly_tuition_amount for f in families_db)
        
        # Count by status
        green_count = len([f for f in families_db if f.billing_status.value == "Green"])
        yellow_count = len([f for f in families_db if f.billing_status.value == "Yellow"])
        red_count = len([f for f in families_db if f.billing_status.value == "Red"])
        
        # Families with high balances
        high_balance_families = [
            {"name": f.family_name, "balance": round(f.current_balance, 2)}
            for f in sorted(families_db, key=lambda x: x.current_balance, reverse=True)[:5]
            if f.current_balance > 100
        ]
        
        return {
            "total_families": total_families,
            "expected_monthly_revenue": round(expected_monthly, 2),
            "total_outstanding_balance": round(total_outstanding, 2),
            "billing_status_breakdown": {
                "green": green_count,
                "yellow": yellow_count,
                "red": red_count
            },
            "collection_rate": f"{round((green_count / total_families) * 100, 1)}%" if total_families > 0 else "0%",
            "families_with_high_balances": high_balance_families
        }
    
    elif function_name == "get_scholarship_summary":
        active_scholarships = [s for s in sufs_scholarships_db if s.status == "Active"]
        
        total_annual_awards = sum(s.annual_award_amount for s in active_scholarships)
        total_remaining = sum(s.remaining_balance for s in active_scholarships)
        total_claimed = total_annual_awards - total_remaining
        
        # Pending claims
        pending_claims = [c for c in sufs_claims_db if c.status.value in ["Submitted", "Pending", "Approved"]]
        pending_amount = sum(c.amount_claimed for c in pending_claims)
        
        # Recent payments
        recent_payments = sorted(sufs_payments_db, key=lambda x: x.payment_date, reverse=True)[:5]
        
        result = {
            "total_scholarship_students": len(active_scholarships),
            "total_annual_awards": round(total_annual_awards, 2),
            "total_claimed": round(total_claimed, 2),
            "total_remaining": round(total_remaining, 2),
            "pending_claims_count": len(pending_claims),
            "pending_claims_amount": round(pending_amount, 2)
        }
        
        if arguments.get("include_pending_claims") and pending_claims:
            result["pending_claims_detail"] = [
                {
                    "claim_id": c.claim_id,
                    "student_id": c.student_id,
                    "amount": c.amount_claimed,
                    "status": c.status.value,
                    "period": c.claim_period
                }
                for c in pending_claims[:10]
            ]
        
        return result
    
    elif function_name == "get_attendance_report":
        # Get attendance for specified period
        target_date = date.today()
        if arguments.get("date") == "yesterday":
            target_date = date.today() - timedelta(days=1)
        
        # Filter attendance records
        if arguments.get("date") == "this_week":
            start_of_week = date.today() - timedelta(days=date.today().weekday())
            records = [a for a in attendance_records_db if a.date >= start_of_week]
        else:
            records = [a for a in attendance_records_db if a.date == target_date]
        
        if not records:
            # Use all recent records if no specific date match
            records = attendance_records_db[-100:] if attendance_records_db else []
        
        present = len([a for a in records if a.status.value == "Present"])
        absent = len([a for a in records if a.status.value == "Absent"])
        tardy = len([a for a in records if a.status.value == "Tardy"])
        
        # Students with attendance concerns (more than 3 absences total)
        concern_students = [s for s in students_db if s.attendance_absent_count > 3]
        
        result = {
            "period": arguments.get("date", "recent"),
            "total_records": len(records),
            "present": present,
            "absent": absent,
            "tardy": tardy,
            "attendance_rate": f"{round(present / len(records) * 100, 1)}%" if records else "N/A",
            "students_with_concerns": len(concern_students)
        }
        
        if arguments.get("show_concerns_only") or len(concern_students) <= 10:
            result["concern_students"] = [
                {
                    "name": f"{s.first_name} {s.last_name}",
                    "grade": s.grade,
                    "absences": s.attendance_absent_count,
                    "tardies": s.attendance_tardy_count
                }
                for s in concern_students[:10]
            ]
        
        return result
    
    elif function_name == "get_learning_progress_report":
        platform = arguments.get("platform", "all")
        show_concerns = arguments.get("show_concerns_only", False)
        
        result = {}
        
        if platform in ["IXL", "all"]:
            ixl_students = []
            for ixl in ixl_summaries_db:
                student = next((s for s in students_db if s.student_id == ixl.student_id), None)
                if student:
                    needs_attention = ixl.math_proficiency.value == "Needs attention" or ixl.ela_proficiency.value == "Needs attention"
                    if not show_concerns or needs_attention:
                        ixl_students.append({
                            "name": f"{student.first_name} {student.last_name}",
                            "grade": student.grade,
                            "weekly_hours": ixl.weekly_hours,
                            "skills_mastered": ixl.skills_mastered_total,
                            "math_status": ixl.math_proficiency.value,
                            "ela_status": ixl.ela_proficiency.value,
                            "last_active": str(ixl.last_active_date),
                            "needs_attention": needs_attention
                        })
            
            result["ixl"] = {
                "total_students": len(ixl_summaries_db),
                "needing_attention": len([s for s in ixl_students if s.get("needs_attention")]),
                "students": ixl_students[:15]
            }
        
        if platform in ["Acellus", "all"]:
            acellus_students = []
            for acc in acellus_summaries_db:
                student = next((s for s in students_db if s.student_id == acc.student_id), None)
                if student:
                    needs_attention = acc.overall_status.value in ["Behind", "At risk"]
                    if not show_concerns or needs_attention:
                        acellus_students.append({
                            "name": f"{student.first_name} {student.last_name}",
                            "grade": student.grade,
                            "courses": acc.total_courses,
                            "on_track": acc.courses_on_track,
                            "behind": acc.courses_behind,
                            "gpa": acc.overall_gpa,
                            "status": acc.overall_status.value,
                            "needs_attention": needs_attention
                        })
            
            result["acellus"] = {
                "total_students": len(acellus_summaries_db),
                "needing_attention": len([s for s in acellus_students if s.get("needs_attention")]),
                "students": acellus_students[:15]
            }
        
        return result
    
    elif function_name == "get_staff_list":
        results = list(staff_db)
        
        if arguments.get("role"):
            results = [s for s in results if s.role.value == arguments["role"]]
        
        return {
            "count": len(results),
            "staff": [
                {
                    "id": s.staff_id,
                    "name": f"{s.first_name} {s.last_name}",
                    "role": s.role.value,
                    "email": s.email,
                    "assigned_rooms": s.assigned_rooms
                }
                for s in results
            ]
        }
    
    elif function_name == "get_leads_pipeline":
        results = list(leads_db)
        
        if arguments.get("stage"):
            results = [l for l in results if l.stage.value == arguments["stage"]]
        
        # Count by stage
        stage_counts = {}
        for lead in leads_db:
            stage = lead.stage.value
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
        
        return {
            "total_leads": len(leads_db),
            "pipeline_stages": stage_counts,
            "filtered_leads": [
                {
                    "id": l.lead_id,
                    "parent_name": f"{l.parent_first_name} {l.parent_last_name}",
                    "child_name": f"{l.child_first_name} {l.child_last_name}",
                    "desired_grade": l.desired_grade,
                    "stage": l.stage.value,
                    "source": l.source.value,
                    "created": str(l.created_date)
                }
                for l in results[:15]
            ]
        }
    
    elif function_name == "get_upcoming_events":
        days_ahead = arguments.get("days_ahead", 30)
        cutoff_date = date.today() + timedelta(days=days_ahead)
        
        upcoming = [e for e in events_db if e.date >= date.today() and e.date <= cutoff_date]
        upcoming = sorted(upcoming, key=lambda x: x.date)
        
        return {
            "count": len(upcoming),
            "events": [
                {
                    "id": e.event_id,
                    "title": e.title,
                    "date": str(e.date),
                    "time": e.time,
                    "type": e.event_type.value,
                    "location": e.location,
                    "requires_rsvp": e.requires_rsvp,
                    "requires_payment": e.requires_payment,
                    "payment_amount": e.payment_amount
                }
                for e in upcoming[:10]
            ]
        }
    
    elif function_name == "get_recent_incidents":
        days_back = arguments.get("days_back", 7)
        cutoff_date = date.today() - timedelta(days=days_back)
        
        recent = [i for i in incidents_db if i.date >= cutoff_date]
        
        if arguments.get("severity"):
            recent = [i for i in recent if i.severity.value == arguments["severity"]]
        
        recent = sorted(recent, key=lambda x: x.date, reverse=True)
        
        return {
            "count": len(recent),
            "incidents": [
                {
                    "id": i.incident_id,
                    "student_id": i.student_id,
                    "date": str(i.date),
                    "type": i.incident_type.value,
                    "severity": i.severity.value,
                    "description": i.description[:100] + "..." if len(i.description) > 100 else i.description,
                    "action_taken": i.action_taken,
                    "parent_notified": i.parent_notified
                }
                for i in recent[:10]
            ]
        }
    
    elif function_name == "get_re_enrollment_status":
        # Check for students with re-enrollment status
        active_students = [s for s in students_db if s.status.value == "Active"]
        
        # For demo, simulate re-enrollment data
        re_enrolled = len([s for s in active_students if hasattr(s, 're_enrolled_next_year') and s.re_enrolled_next_year])
        not_re_enrolled = len(active_students) - re_enrolled
        
        return {
            "total_active_students": len(active_students),
            "re_enrolled": re_enrolled,
            "pending": not_re_enrolled,
            "re_enrollment_rate": f"{round(re_enrolled / len(active_students) * 100, 1)}%" if active_students else "0%"
        }
    
    elif function_name == "create_export_report":
        # Import the exports module
        from app.exports import create_export, ExportSpec
        
        # Build the export specification
        spec = ExportSpec(
            dataset=arguments.get("dataset", "students"),
            columns=arguments.get("columns", []),
            format=arguments.get("format", "csv"),
            title=arguments.get("title", "Export"),
            filters=arguments.get("filters"),
            sort_by=arguments.get("sort_by"),
            sort_order=arguments.get("sort_order", "asc"),
            max_rows=1000
        )
        
        # Create the export
        result = create_export(spec, data_context)
        
        if "error" in result:
            return result
        
        return {
            "success": True,
            "message": f"Report created successfully with {result['row_count']} records.",
            "filename": result["filename"],
            "download_url": result["download_url"],
            "format": spec.format,
            "expires_at": result["expires_at"],
            "row_count": result["row_count"]
        }
    
    elif function_name == "get_crm_help":
        topic = arguments.get("topic", "").lower()
        user_role = arguments.get("user_role", "admin").lower()
        
        # Comprehensive help topics with step-by-step instructions
        help_topics = {
            # Student management
            "add student": {
                "title": "How to Add a New Student",
                "roles": ["admin"],
                "steps": [
                    "Go to the Students page by clicking 'Students' in the top navigation",
                    "Click the 'Add Student' button in the top right",
                    "Fill in the student's information: first name, last name, grade level, session (morning/afternoon), and assigned room",
                    "Add family information or link to an existing family",
                    "Select the funding source: Step-Up (SUFS scholarship), Out-of-Pocket, or Mixed",
                    "Click 'Submit' to enroll the student"
                ]
            },
            "view student": {
                "title": "How to View Student Details",
                "roles": ["admin", "teacher"],
                "steps": [
                    "Go to Students page (Admin) or My Rooms (Teacher)",
                    "Find the student in the list",
                    "Click on the student's name to open their profile",
                    "Click 'View Full Student & Family Account' for complete details including grades, attendance, and family billing"
                ]
            },
            "student grades": {
                "title": "How to View/Enter Student Grades",
                "roles": ["admin", "teacher"],
                "steps": [
                    "For Admin: Go to Academics → Standards Gradebook",
                    "For Teacher: Click the Gradebook tab in your dashboard",
                    "Select the student or class you want to view/edit",
                    "Enter or update grades as needed",
                    "Changes are saved automatically"
                ]
            },
            # Attendance
            "take attendance": {
                "title": "How to Take Attendance",
                "roles": ["admin", "teacher"],
                "steps": [
                    "Go to My Rooms (Teacher) or Students page (Admin)",
                    "Select the room/class",
                    "Click 'Take Attendance'",
                    "Mark each student as Present, Absent, or Tardy",
                    "Add notes if needed (e.g., reason for absence)",
                    "Click 'Submit' to save attendance"
                ]
            },
            "attendance": {
                "title": "How to View Attendance",
                "roles": ["admin", "teacher", "parent"],
                "steps": [
                    "Admin: Dashboard shows today's attendance summary, or go to Students → click student → view attendance history",
                    "Teacher: My Rooms shows attendance for your classes",
                    "Parent: My Children tab shows your child's attendance summary"
                ]
            },
            # Billing and payments
            "record payment": {
                "title": "How to Record a Payment",
                "roles": ["admin"],
                "steps": [
                    "Go to Families & Finance",
                    "Find and click on the family name",
                    "Click 'Record Payment'",
                    "Enter the payment amount",
                    "Select payment method (cash, check, card, etc.)",
                    "Add any notes if needed",
                    "Click 'Submit' to record the payment"
                ]
            },
            "billing": {
                "title": "How to Check Billing Status",
                "roles": ["admin", "parent"],
                "steps": [
                    "Admin: Go to Families & Finance to see all families with billing status colors (Green=current, Yellow=warning, Red=overdue)",
                    "Parent: Click the Billing tab to see your family's balance, payment history, and tuition breakdown"
                ]
            },
            "overdue": {
                "title": "How to Find Families with Overdue Balances",
                "roles": ["admin"],
                "steps": [
                    "Go to Families & Finance",
                    "Look for families with RED billing status",
                    "Or use the Dashboard alerts section which shows overdue families count",
                    "Click on a family to see details and payment history"
                ]
            },
            # SUFS Scholarships
            "sufs": {
                "title": "How to Manage SUFS Scholarships",
                "roles": ["admin"],
                "steps": [
                    "Go to Families & Finance",
                    "Click the 'SUFS Scholarships' tab to view all scholarship recipients",
                    "Click 'SUFS Payment Queue' tab to see pending bi-monthly payments",
                    "When a SUFS payment is received, click 'Record Payment' next to the family",
                    "Enter the payment details and submit"
                ]
            },
            "scholarship": {
                "title": "How to Track Scholarship Payments",
                "roles": ["admin"],
                "steps": [
                    "Go to Families & Finance → SUFS Payment Queue",
                    "View pending payments organized by period (Aug, Oct, Dec, Feb, Apr, Jun)",
                    "When payment is received from Step Up for Students, click 'Record Payment'",
                    "The family's balance will be updated automatically"
                ]
            },
            # Messaging
            "send message": {
                "title": "How to Send a Message",
                "roles": ["admin", "teacher", "parent"],
                "steps": [
                    "Go to Communications (Admin) or Messages tab (Teacher/Parent)",
                    "Click 'New Message'",
                    "Admin/Teacher: Select recipient type (Parent or Staff Member)",
                    "Select the specific person from the dropdown",
                    "Type your message",
                    "Click 'Send'"
                ]
            },
            "message": {
                "title": "How to Use the Messaging System",
                "roles": ["admin", "teacher", "parent"],
                "steps": [
                    "Access Messages from your dashboard (Communications for Admin, Messages tab for Teacher/Parent)",
                    "View your Inbox for received messages",
                    "View Sent for messages you've sent",
                    "A red badge on the tab shows unread message count",
                    "Click 'New Message' to compose a new message"
                ]
            },
            # Learning Progress
            "upload ixl": {
                "title": "How to Upload IXL Progress Data",
                "roles": ["admin", "teacher"],
                "steps": [
                    "Export your class data from IXL as a CSV file",
                    "Go to Academics → Import Progress (Admin) or Learning Progress tab (Teacher)",
                    "Click 'Import Progress Data'",
                    "Select the 'IXL' tab",
                    "Download the template if you need to see the expected format",
                    "Upload your CSV file",
                    "The system will match students by name and update their records"
                ]
            },
            "upload acellus": {
                "title": "How to Upload Acellus Progress Data",
                "roles": ["admin", "teacher"],
                "steps": [
                    "Export your class data from Acellus as a CSV file",
                    "Go to Academics → Import Progress (Admin) or Learning Progress tab (Teacher)",
                    "Click 'Import Progress Data'",
                    "Select the 'Acellus' tab",
                    "Download the template if you need to see the expected format",
                    "Upload your CSV file",
                    "The system will match students by name and update their records"
                ]
            },
            "learning progress": {
                "title": "How to Track Learning Progress",
                "roles": ["admin", "teacher", "parent"],
                "steps": [
                    "Admin: Go to Academics → Learning Progress to see all students' IXL/Acellus progress",
                    "Teacher: Click Learning Progress tab to see your students' progress and import new data",
                    "Parent: My Children tab shows your child's learning progress summary"
                ]
            },
            # Re-enrollment
            "re-enroll": {
                "title": "How to Re-Enroll a Student",
                "roles": ["admin", "teacher", "parent"],
                "steps": [
                    "Parent: Go to My Children, scroll to Re-Enrollment section, click 'Re-Enroll for [Year]', complete payment",
                    "Admin/Teacher: View student's full account, scroll to Re-Enrollment section, click 'Re-Enroll for [Year]'"
                ]
            },
            "enrollment fee": {
                "title": "How to Set the Enrollment Fee",
                "roles": ["admin"],
                "steps": [
                    "Go to Operations → Fees & Products",
                    "Click 'Create New'",
                    "Select category 'Enrollment Fee'",
                    "Enter the fee amount (e.g., $500)",
                    "Click 'Save'",
                    "This fee will automatically appear when parents re-enroll"
                ]
            },
            # Events
            "add event": {
                "title": "How to Add a School Event",
                "roles": ["admin"],
                "steps": [
                    "Go to Operations → Events",
                    "Click 'Add Event'",
                    "Enter event details: title, date, time, location, description",
                    "Set RSVP requirements if needed",
                    "Add permission slip if required",
                    "Click 'Save' to publish the event"
                ]
            },
            "events": {
                "title": "How to View School Events",
                "roles": ["admin", "teacher", "parent"],
                "steps": [
                    "Admin: Go to Operations → Events",
                    "Teacher: Click the Events tab",
                    "Parent: Click the Events tab to see upcoming events and RSVP"
                ]
            },
            # Incidents
            "report incident": {
                "title": "How to Report an Incident",
                "roles": ["admin", "teacher"],
                "steps": [
                    "Go to Incidents tab",
                    "Click 'Report Incident'",
                    "Select the student involved",
                    "Choose incident type (behavioral, safety, etc.)",
                    "Enter description of what happened",
                    "Set severity level",
                    "Add any witnesses or notes",
                    "Click 'Submit'"
                ]
            },
            # Admissions
            "add lead": {
                "title": "How to Add a New Lead",
                "roles": ["admin"],
                "steps": [
                    "Go to Admissions",
                    "Click 'Add Lead'",
                    "Enter parent/guardian information",
                    "Enter prospective student information",
                    "Select grade interest",
                    "Note the source (referral, website, etc.)",
                    "Click 'Save'"
                ]
            },
            "admissions": {
                "title": "How to Manage Admissions Pipeline",
                "roles": ["admin"],
                "steps": [
                    "Go to Admissions to see all leads",
                    "Leads are organized by stage: New Inquiry → Contacted → Tour Scheduled → Toured → Application Submitted → Accepted → Enrolled",
                    "Click on a lead to update their status or add notes",
                    "Move leads through stages as they progress"
                ]
            },
            # Staff
            "manage staff": {
                "title": "How to Manage Staff",
                "roles": ["admin"],
                "steps": [
                    "Go to Operations → Staff",
                    "View all staff members with their roles and contact info",
                    "Click 'Add Staff' to add a new staff member",
                    "Click on a staff member to edit their information"
                ]
            },
            # Documents
            "upload document": {
                "title": "How to Upload a Document",
                "roles": ["admin"],
                "steps": [
                    "Go to Documents & Forms → Document Library",
                    "Click 'Upload'",
                    "Select the file from your computer",
                    "Add a title and description",
                    "Select who can view it (All, Parents, Staff)",
                    "Click 'Upload'"
                ]
            },
            # At-risk students
            "at-risk": {
                "title": "How to View At-Risk Students",
                "roles": ["admin", "teacher"],
                "steps": [
                    "Admin: Go to Analytics → At-Risk Report, or check Dashboard alerts",
                    "Teacher: Look for students with red risk flags in your rooms",
                    "Click on a student to see why they're flagged (attendance issues, grade issues, etc.)"
                ]
            }
        }
        
        # Find matching help topic
        matched_topic = None
        for key, value in help_topics.items():
            if key in topic or topic in key:
                if user_role in value["roles"] or "admin" in value["roles"]:
                    matched_topic = value
                    break
        
        if matched_topic:
            return {
                "title": matched_topic["title"],
                "steps": matched_topic["steps"],
                "available_for_role": user_role in matched_topic["roles"]
            }
        else:
            # Return general guidance
            return {
                "message": f"I don't have specific step-by-step instructions for '{topic}', but I can help you find what you need. What are you trying to accomplish?",
                "suggestion": "Try asking about: adding students, taking attendance, recording payments, sending messages, uploading IXL/Acellus data, re-enrollment, managing events, or viewing reports."
            }
    
    elif function_name == "get_available_features":
        user_role = arguments.get("user_role", "admin").lower()
        
        features = {
            "admin": {
                "role": "Administrator",
                "dashboard_sections": [
                    "Dashboard - Overview of key metrics, alerts, and daily devotional",
                    "Students - Complete student roster, add/edit students, view full profiles",
                    "Families & Finance - Family accounts, billing, SUFS scholarships, payment queue",
                    "Admissions - Enrollment pipeline, leads management",
                    "Academics - Standards gradebook, learning progress, IXL/Acellus import",
                    "Student Support - IEP/504 management, interventions",
                    "Communications - Direct messages, broadcasts, announcements",
                    "Operations - Events, staff management, fees/products, enrollment forms",
                    "Documents & Forms - Document library, form management",
                    "Analytics - At-risk reports, advanced analytics"
                ],
                "key_actions": [
                    "Add/edit students and families",
                    "Record payments and manage billing",
                    "Track SUFS scholarship payments",
                    "Send messages to parents and staff",
                    "Create school events",
                    "Import IXL/Acellus learning progress",
                    "View at-risk student reports",
                    "Manage enrollment pipeline"
                ]
            },
            "teacher": {
                "role": "Coach/Teacher",
                "dashboard_sections": [
                    "My Rooms - Your assigned classrooms and students",
                    "Gradebook - Enter and view grades",
                    "Announcements - View and create announcements",
                    "Events - School events calendar",
                    "Documents - School documents",
                    "Photos - Photo gallery",
                    "Messages - Direct messaging with parents and staff",
                    "Incidents - Report and view incidents",
                    "Health Records - Student health information",
                    "Learning Progress - Import IXL/Acellus data"
                ],
                "key_actions": [
                    "Take attendance for your classes",
                    "Enter grades",
                    "View full student and family accounts",
                    "Message parents and other staff",
                    "Report incidents",
                    "Upload IXL/Acellus progress data",
                    "Re-enroll students"
                ]
            },
            "parent": {
                "role": "Parent",
                "dashboard_sections": [
                    "My Children - Overview of your children's progress",
                    "Billing - Your family's billing and payment history",
                    "Events - School events and RSVPs",
                    "Documents - School documents and forms",
                    "Store - School store",
                    "Photos - Photo gallery",
                    "Messages - Messages with school staff",
                    "Health - Your child's health records",
                    "Enrollment - Enrollment forms and status"
                ],
                "key_actions": [
                    "View your child's grades and attendance",
                    "Check billing status and payment history",
                    "RSVP to school events",
                    "Message teachers and staff",
                    "Re-enroll your child for next year",
                    "Complete enrollment forms"
                ]
            }
        }
        
        return features.get(user_role, features["admin"])
    
    return {"error": f"Unknown function: {function_name}"}


async def chat_with_auvora(
    user_message: str,
    conversation_history: List[dict],
    data_context: dict,
    user_role: str = "admin"
) -> dict:
    """
    Main chat function that processes user messages and returns AI responses.
    
    Args:
        user_message: The user's question or request
        conversation_history: Previous messages in the conversation
        data_context: Dictionary containing all the database data
        user_role: The role of the user (admin, teacher, parent)
    
    Returns:
        Dictionary with response text and any relevant data
    """
    
    try:
        openai_client = get_openai_client()
    except ValueError as e:
        return {
            "response": "I'm sorry, but I'm not fully configured yet. Please contact the administrator to set up the AI assistant.",
            "error": str(e)
        }
    
    # Apply role-based data filtering
    filtered_data_context = filter_data_context_by_role(data_context, user_role)
    
    # Get role-specific functions
    role_functions = get_functions_for_role(user_role)
    
    # Build role-specific system prompt
    role_prompt_addition = ROLE_PROMPTS.get(user_role, ROLE_PROMPTS["parent"])
    full_system_prompt = SYSTEM_PROMPT + "\n\n=== CURRENT USER ROLE ACCESS LEVEL ===\n" + role_prompt_addition
    
    # Build messages array
    messages = [
        {"role": "system", "content": full_system_prompt}
    ]
    
    # Add conversation history (last 10 messages)
    for msg in conversation_history[-10:]:
        messages.append(msg)
    
    # Add current user message
    messages.append({"role": "user", "content": user_message})
    
    try:
        # First API call - let the model decide if it needs to call functions
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=role_functions if role_functions else None,
            tool_choice="auto" if role_functions else None,
            temperature=0.7,
            max_tokens=2000
        )
        
        assistant_message = response.choices[0].message
        
        # Check if the model wants to call functions
        if assistant_message.tool_calls:
            # Execute all function calls
            function_results = []
            
            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                arguments = json.loads(tool_call.function.arguments)
                
                # Execute the function with filtered data context
                result = execute_function(function_name, arguments, filtered_data_context)
                
                function_results.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "content": json.dumps(result)
                })
            
            # Add assistant message with tool calls
            messages.append({
                "role": "assistant",
                "content": assistant_message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in assistant_message.tool_calls
                ]
            })
            
            # Add function results
            for fr in function_results:
                messages.append(fr)
            
            # Second API call - get final response with function results
            final_response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            final_text = final_response.choices[0].message.content
            
            return {
                "response": final_text,
                "functions_called": [tc.function.name for tc in assistant_message.tool_calls],
                "data_retrieved": True
            }
        
        else:
            # No function calls needed - return direct response
            return {
                "response": assistant_message.content,
                "functions_called": [],
                "data_retrieved": False
            }
    
    except Exception as e:
        return {
            "response": f"I encountered an error while processing your request. Please try again or rephrase your question.",
            "error": str(e)
        }
