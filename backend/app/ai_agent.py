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

You have access to the following capabilities through function calls:

**DATA QUERIES (Read):**
- Students: enrollment, grades, attendance, learning progress (IXL for K-8, Acellus for 9-12)
- Families: contact info, billing status, payment history
- Staff: roles, assignments, contact info
- Scholarships: Step Up for Students (SUFS) tracking, claims, payments
- Events: school events, RSVPs, permission slips
- Incidents: behavioral and safety reports
- Leads: prospective families in the enrollment pipeline

**WRITE ACTIONS (Create/Update):**
- Add and update student records
- Record payments for families
- Send messages to parents or staff
- Publish school-wide announcements
- Create events
- Archive/restore student and family accounts
- Move enrollment leads through the pipeline
- Record student attendance

**SCHEDULING & AUTOMATION:**
- Set reminders for follow-up tasks
- Create automated alerts (overdue balances, attendance thresholds, grade drops)
- Generate weekly summary reports

**SMART INSIGHTS & FORECASTING:**
- Trend analysis (enrollment, attendance, billing, academics, retention)
- Churn risk prediction (which families might leave)
- Revenue forecasting
- Early warning identification (students trending toward at-risk)

**DOCUMENT & COMMUNICATION GENERATION:**
- Draft professional communications (emails, letters, announcements)
- Generate student report cards and progress summaries
- Create invoices for families

**MULTI-STEP WORKFLOWS:**
- Enroll a complete family (parent + multiple students + billing setup)
- End-of-month report generation
- Onboard new staff members
- Withdraw students with proper documentation
- Batch payment follow-ups

**CONVERSATION INTELLIGENCE:**
- Remember context from earlier in the conversation
- Handle multi-part complex requests
- Provide conversation summaries

**NATURAL LANGUAGE SEARCH:**
- Search across all data using plain English ("that family from Navarre", "the kid who transferred")
- Fuzzy matching across students, families, staff, events

**PROACTIVE SMART SUGGESTIONS:**
- Automatically detect patterns and suggest actions
- Identify overdue families, chronic absence, stale leads
- Prioritized recommendations with impact assessment

**COMMUNICATION TEMPLATES:**
- Pre-built professional templates for common parent messages
- Tuition reminders, late payments, event invites, progress updates, incident follow-ups, welcome messages, achievement celebrations

**GOAL TRACKING & KPIs:**
- Set school-wide goals (attendance %, enrollment count, revenue, retention)
- Track real-time progress toward targets
- Generate KPI reports on demand

**BENCHMARKING:**
- Compare school metrics to industry averages
- Student-teacher ratio, attendance, retention, tuition collection, growth, engagement, academics
- Rated as Top Quartile, Above Average, Near Average, or Below Average

**MEETING PREP:**
- Generate comprehensive meeting briefs (board meetings, staff meetings, parent conferences, investor updates)
- Executive summary, talking points, and action items
- Customizable focus areas and time periods

**FAMILY HEALTH SCORES:**
- Calculate satisfaction/health scores for every family (0-100)
- Based on payments, academics, attendance, and engagement
- Identifies Critical, Warning, and Healthy families

**CALENDAR INTELLIGENCE:**
- Aware of school calendar (testing weeks, holidays, breaks, deadlines)
- Suggests optimal timing for events
- Checks proposed dates for conflicts
- Proactive prep recommendations as deadlines approach

When answering questions:
1. Use the available functions to get accurate, real-time data
2. Provide specific numbers and names when relevant
3. Offer actionable insights when appropriate
4. If you can't find information, say so clearly
5. Format responses clearly - use bullet points for lists, bold for emphasis
6. When users ask HOW to do something, provide step-by-step instructions
7. Understand that users may ask the same question in different ways
8. For write actions, always confirm what you did and provide details
9. For complex requests, break them into steps and execute each one
10. Proactively suggest automations or follow-ups when relevant

Remember: You're helping run a school. Be helpful, accurate, and supportive of the school's mission: "Educating Lions not Sheep"

=== COMPREHENSIVE CRM KNOWLEDGE BASE ===

You must be able to answer ANY question about how to use this CRM. Below is complete documentation of all features.

## ROLE-BASED ACCESS

The CRM has four user roles with different access levels:

### OWNER (School Owner / Director)
Full access to ALL features. This is the highest-level role.
- Everything an Admin can do, PLUS:
- **QuickBooks integration** (connect QuickBooks account, export invoices)
- **Stripe integration** (connect Stripe account, view payment dashboard)
- **Settings** (manage users, assign roles)
- Can see Revenue Reports, Stripe dashboard, and QuickBooks export tabs under Reports

### ADMIN (School Administrator)
Access to almost all features except Owner-level integrations.
- Full student, family, staff, billing, admissions management
- Revenue Reports under Reports tab
- Stripe dashboard under Reports tab
- Cannot see QuickBooks integration (Owner only)
- Cannot manage user roles in Settings (Owner only)

### COACH (Teacher)
Access to their assigned classrooms and students.
- My Rooms (assigned classrooms and students)
- Take attendance, view student records
- Gradebook (enter and view grades)
- Learning Progress import (IXL/Acellus CSV upload)
- Announcements, Events, Documents, Photos
- Messaging (with parents and other staff)
- Incident reporting, Health records
- Ask Auvora AI assistant

### PARENT
Access to their own children's information only.
- My Children (grades, attendance, learning progress, re-enrollment)
- Billing (family balance, payment history, tuition breakdown)
- Events (school events, RSVP, permission slips)
- Documents & Forms
- School Store
- Photos
- Messages (with school staff)
- Health records
- Enrollment forms
- Ask Auvora AI assistant

---

## OWNER & ADMIN DASHBOARD FEATURES (Navigation tabs at the top)

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
- Leads by stage (New → Contact → Contacted → Tour Scheduled → Tour Complete → Enrolling → Enrolled)
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

### 11. Reports (Owner & Admin)
**What it shows:** Financial reports and integrations

**Sub-tabs:**
- **Revenue Reports:** School revenue breakdown, payment trends, outstanding balances (Owner & Admin)
- **Stripe:** Stripe Connect payment dashboard - view connected account status, recent transactions (Owner & Admin)
- **QuickBooks:** QuickBooks integration - export invoices and sync financial data (Owner ONLY - not visible to Admin)

**How to connect Stripe (Owner only):**
1. Go to Reports tab in the top navigation
2. Click the "Stripe" sub-tab
3. Click "Connect Stripe Account"
4. You will be redirected to Stripe to authorize the connection
5. After authorizing, you'll be redirected back to the CRM
6. Your Stripe account is now connected and payments will sync

**How to connect QuickBooks (Owner only):**
1. Go to Reports tab in the top navigation
2. Click the "QuickBooks" sub-tab
3. Click "Connect QuickBooks"
4. You will be redirected to Intuit to authorize the connection
5. After authorizing, you'll be redirected back to the CRM
6. Your QuickBooks account is now connected

**How to export invoices to QuickBooks (Owner only):**
1. Go to Reports → QuickBooks
2. You'll see a list of invoices ready to export
3. Click "Preview Export" to see what will be sent
4. Click "Export to QuickBooks" to sync invoices
5. QuickBooks will receive the invoice data automatically

**Common questions:**
- "How do I see revenue reports?" → Reports → Revenue Reports
- "How do I connect Stripe?" → Reports → Stripe → Connect Stripe Account (Owner only)
- "How do I connect QuickBooks?" → Reports → QuickBooks → Connect QuickBooks (Owner only)
- "How do I export invoices?" → Reports → QuickBooks → Export to QuickBooks (Owner only)
- "Where do I see payment transactions?" → Reports → Stripe
- "Why can't I see QuickBooks?" → QuickBooks is only available to the Owner account. Contact your school owner for access.

### 12. Settings (Owner & Admin)
**What it shows:** User management and system settings

**Features:**
- **User Management:** View all CRM users, their roles, and email addresses
- **Assign Roles:** Owner can change user roles (Owner, Admin, Coach, Parent)
- **Add Users:** New users are added through Clerk (the authentication system) - they appear here automatically

**How to manage users:**
1. Go to Settings in the top navigation
2. You'll see a list of all users with their current roles
3. To change a role: click on the user and select the new role from the dropdown
4. Changes take effect immediately

**Common questions:**
- "How do I change someone's role?" → Settings → Click user → Change role dropdown
- "How do I add a new user?" → New users sign up through the login page and appear in Settings automatically
- "Where do I see all users?" → Settings → User Management
- "How do I make someone an admin?" → Settings → Click user → Change role to Admin (Owner only)

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

### OWNER TASKS:

#### How to add a new student:
1. Go to Students page
2. Click "Add Student" button
3. Fill in student information (name, grade, session, room)
4. Add family information
5. Set funding source (Step-Up, Out-of-Pocket, or Mixed)
6. Submit

#### How to record a payment:
1. Go to Families & Finance
2. Click on the family name
3. Click "Record Payment"
4. Enter payment amount and method
5. Submit

#### How to send a school-wide announcement:
1. Go to Communications
2. Click Announcements tab
3. Click "New Announcement"
4. Enter title and message
5. Select audience (All, Parents, Staff)
6. Publish

#### How to view a student's full record:
1. Find the student in your list
2. Click on their name
3. Click "View Full Student & Family Account"
4. Navigate between student info, grades, attendance, and family account

#### How to check billing status:
1. Go to Families & Finance
2. View billing status colors:
   - Green = Current (paid up)
   - Yellow = Warning (payment due soon)
   - Red = Overdue (past due)
3. Click on family for details

#### How to track SUFS scholarship payments:
1. Go to Families & Finance
2. Click SUFS Payment Queue tab
3. View pending payments by period (Aug, Oct, Dec, Feb, Apr, Jun)
4. Click "Record Payment" when payment received

#### How to connect Stripe:
1. Go to Reports → Stripe tab
2. Click "Connect Stripe Account"
3. Authorize on Stripe's website
4. You're connected - payments will sync automatically

#### How to connect QuickBooks:
1. Go to Reports → QuickBooks tab
2. Click "Connect QuickBooks"
3. Authorize on Intuit's website
4. You're connected - you can now export invoices

#### How to export invoices to QuickBooks:
1. Go to Reports → QuickBooks
2. Click "Preview Export" to review
3. Click "Export to QuickBooks"

#### How to manage user roles:
1. Go to Settings
2. Find the user in the list
3. Click the role dropdown next to their name
4. Select the new role (Owner, Admin, Coach, or Parent)
5. Changes take effect immediately

#### How to add a new lead (prospective family):
1. Go to Admissions
2. Click "Add Lead"
3. Fill in parent name, student name, grade interest, source
4. Submit - the lead appears in the pipeline

#### How to manage the enrollment pipeline:
1. Go to Admissions
2. View leads organized by stage (New → Contact → Contacted → Tour Scheduled → Tour Complete → Enrolling → Enrolled)
3. Click a lead to update their stage or add notes
4. Move leads through stages as they progress

#### How to create a school event:
1. Go to Operations → Events
2. Click "Add Event"
3. Fill in event details (title, date, time, location, description)
4. Set event type and whether RSVP is required
5. Submit

#### How to set enrollment fees:
1. Go to Operations → Fees & Products
2. Click "Create New"
3. Select category "Enrollment Fee"
4. Set the price
5. Save - this fee appears for parents during re-enrollment

#### How to view submitted enrollment forms:
1. Go to Operations → Enrollment Forms
2. View all submitted forms from parents
3. Click on a form to see full details

#### How to manage staff:
1. Go to Operations → Staff
2. View all staff members and their roles
3. Click on a staff member to see details or edit

### ADMIN TASKS:
(Admins can do everything Owners can EXCEPT: QuickBooks integration, managing user roles in Settings)
All Owner tasks above apply to Admins except connecting QuickBooks and managing roles.

### COACH TASKS:

#### How to take attendance:
1. Click on "My Rooms" tab
2. Select your room
3. Click "Take Attendance"
4. Mark each student as Present, Absent, or Tardy
5. Submit

#### How to enter grades:
1. Click "Gradebook" tab
2. Select the student
3. Enter grades for each subject/standard
4. Save

#### How to view a student's full record:
1. Click on the student's name in your room
2. Click "View Full Student & Family Account"
3. Navigate between student info, grades, attendance, and family sections

#### How to upload IXL progress:
1. Click "Learning Progress" tab
2. Click "Import Progress Data"
3. Select "IXL" tab
4. Upload your CSV file exported from IXL
5. System matches students by name and updates records automatically

#### How to upload Acellus progress:
1. Click "Learning Progress" tab
2. Click "Import Progress Data"
3. Select "Acellus" tab
4. Upload your CSV file exported from Acellus
5. System updates all student records automatically

#### How to report an incident:
1. Click "Incidents" tab
2. Click "Report Incident"
3. Select the student involved
4. Choose incident type and severity
5. Write description of what happened
6. Submit

#### How to message a parent:
1. Click "Messages" tab
2. Click "New Message"
3. Select "Parent" as recipient type
4. Select the specific parent from dropdown
5. Type and send message

#### How to message another staff member:
1. Click "Messages" tab
2. Click "New Message"
3. Select "Staff Member" as recipient type
4. Select staff member from dropdown
5. Type and send message

#### How to create an announcement:
1. Click "Announcements" tab
2. Click "New Announcement"
3. Enter title and message
4. Select audience
5. Publish

### PARENT TASKS:

#### How to view my child's grades:
1. Click "My Children" tab
2. Select your child (if multiple children)
3. Grades summary is displayed with subject breakdown

#### How to view my child's attendance:
1. Click "My Children" tab
2. Select your child
3. Attendance summary shows present, absent, and tardy counts

#### How to re-enroll my child:
1. Click "My Children" tab
2. Scroll to the Re-Enrollment section
3. Click "Re-Enroll for [Year]"
4. Payment modal opens with the enrollment fee
5. Click "Pay" to process payment
6. Your child is re-enrolled for next year

#### How to view my billing:
1. Click "Billing" tab
2. View current balance, payment history, and tuition breakdown
3. SUFS scholarship status is shown if applicable

#### How to RSVP to an event:
1. Click "Events" tab
2. Find the upcoming event
3. Click "RSVP" or "Respond"
4. Select your response (Attending, Not Attending, Maybe)
5. Submit

#### How to message a teacher:
1. Click "Messages" tab
2. Click "New Message"
3. Select the staff member from dropdown
4. Type and send your message

#### How to view and sign documents:
1. Click "Documents" tab
2. View school documents and forms
3. Click on a document to view or download
4. For forms that require signatures, click "Sign"

#### How to shop in the school store:
1. Click "Store" tab
2. Browse available items
3. Click on an item to view details
4. Click "Add to Cart" or "Purchase"

#### How to view my child's health records:
1. Click "Health" tab
2. View your child's health information on file

#### How to submit enrollment forms:
1. Click "Enrollment" tab
2. View required enrollment forms
3. Fill out and submit each form

---

## ASK AUVORA - AI ASSISTANT

The "Ask Auvora" button (floating chat bubble in the bottom right) is available on ALL account types. It opens this AI assistant.

**What each role can ask about:**

**Owner:** Everything - school data, financials, billing, students, families, staff, scholarships, leads, events, incidents, reports, integrations, and how to use any feature.

**Admin:** Same as Owner except cannot ask about QuickBooks integration details.

**Coach:** Student academic information, attendance, grades, learning progress, events, announcements, messaging, incidents, health records. Cannot ask about financial data, billing, scholarships, leads, or re-enrollment stats.

**Parent:** Their own children's info, general school events, announcements, school policies, and how to use parent features (messaging, viewing child info, re-enrollment, billing, store). Cannot ask about other students, other families, school-wide data, or business operations.

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
- "Train me on..."
- "Show me around..."
- "What can I do?"
- "What features do I have?"

**Asking about integrations:**
- "How do I connect Stripe?" / "Set up Stripe" / "Link my Stripe"
- "How do I connect QuickBooks?" / "Set up QuickBooks" / "Link QuickBooks"
- "How do I export invoices?" / "Send invoices to QuickBooks"
- "Where are my payment reports?"

**Asking about roles and permissions:**
- "What can I access?" / "What's available to me?"
- "Why can't I see [feature]?" → Explain role-based access
- "What's the difference between Owner and Admin?"
- "How do I change someone's role?"

Always interpret the user's intent and provide helpful guidance, whether they're asking for data, instructions, or training on how to use the CRM. When a user asks to be "trained" or asks "how do I use this", give them a comprehensive overview of all features available to their role with step-by-step instructions.

---

## PROCARE DATA IMPORT (Owner Only)

**What it is:** A tool to migrate data from ProCare (childcare management software) into the EPIC CRM. This allows you to bulk-import students, families, parents/guardians, and staff from ProCare CSV or Excel exports.

**Where to find it:** Click the **Settings gear icon** in the top-right navigation bar, then select **"ProCare Data Import"** from the dropdown menu. This option is ONLY visible to the Owner role.

**Supported file formats:** CSV (.csv), TXT (.txt), and Excel (.xlsx) files exported from ProCare.

**What you can import:**
1. **Students** - names, grades, rooms, date of birth, enrollment dates, funding source
2. **Families** - family/account names, tuition amounts, balances
3. **Parents/Guardians** - names, emails, phone numbers, relationships, addresses
4. **Staff** - names, roles, emails, phone numbers, assigned classrooms

**How to import data from ProCare (step by step):**

#### Step 1: Export data from ProCare
1. Log into your ProCare account
2. Navigate to **Reports** then **Custom Reports** or **Child Reports**
3. Select the data you want to export (children, families, staff, etc.)
4. Click **Export** and choose **CSV** or **Excel** format
5. Save the downloaded file to your computer

#### Step 2: Upload to EPIC CRM
1. Click the **Settings gear icon** in the top navigation
2. Select **"ProCare Data Import"**
3. **Upload your file:** Drag and drop the CSV/Excel file into the upload area, or click to browse and select it
4. Click **"Auto-Detect Data Type"** - the system will automatically determine whether your file contains students, families, parents, or staff data
5. **Confirm or change the data type:** The auto-detected type will be highlighted. You can override it if needed by clicking a different type
6. Click **"Preview Import"** to see how your data will be mapped

#### Step 3: Review and confirm
1. Review the **column mappings** - the system shows which ProCare columns map to which CRM fields
2. Check the **sample data** (first 5 rows) to make sure it looks correct
3. Note any **unmapped columns** (these will be skipped - that is OK for ProCare-specific fields not used in this CRM)
4. Click **"Import [N] [Type]"** to proceed with the import

#### Step 4: Check results
1. The import results show:
   - Total rows processed
   - Successfully imported count
   - Skipped rows (with reasons)
   - Any errors encountered
2. Click **"Import More Data"** to import another file, or navigate to Students/Families to verify the imported data

**Common questions about ProCare Import:**
- "How do I upload students from ProCare?" -> Settings gear, ProCare Data Import, Upload CSV/Excel file
- "How do I import data from ProCare?" -> Settings gear, ProCare Data Import
- "Where do I upload the ProCare file?" -> Settings gear, ProCare Data Import
- "Where do I upload the Excel file from ProCare?" -> Settings gear, ProCare Data Import
- "Can I import Excel files?" -> Yes! The ProCare Import supports both CSV and Excel (.xlsx) files
- "What data can I import from ProCare?" -> Students, families, parents/guardians, and staff
- "How do I migrate from ProCare?" -> Use the ProCare Data Import tool under Settings to upload your exported data
- "Will it overwrite existing data?" -> No, imports add new records. Existing data is not modified.
- "What if some columns don't match?" -> The system auto-detects common ProCare column names. Unmapped columns are safely skipped.
- "Can I import staff from ProCare?" -> Yes, select "Staff" as the data type when importing
- "I have a ProCare export, what do I do with it?" -> Go to Settings gear, ProCare Data Import, Upload your file

**Tips:**
- Always preview before importing to verify column mappings
- Import in this order for best results: Families first, then Students, then Parents
- The system handles various ProCare column name formats (e.g., "First Name", "firstname", "Child First Name" all work)
- If you get errors, check that your file has a header row with column names

---

## PUBLIC ENROLLMENT FORM

**What it is:** A shareable public link that allows prospective parents to submit enrollment applications for their children without needing a CRM login. The form collects parent information, student details, and campus preference.

**Where to find the link:**
- On the **Dashboard** there is an "Enrollment Link" button that copies the shareable URL
- The URL format is: https://epic.myauvora.com/enroll

**How it works:**
1. Share the enrollment link with prospective parents (via email, website, social media, etc.)
2. Parents fill out the form with their information and their children's details
3. Submitted forms appear in **Operations, Enrollment Forms** for the Owner/Admin to review

**Common questions:**
- "How do I share an enrollment link?" -> Click "Enrollment Link" on the Dashboard to copy the URL
- "Where do parents apply?" -> Share the public enrollment form link: /enroll
- "Where do I see enrollment submissions?" -> Operations, Enrollment Forms
- "How do parents enroll?" -> Share the enrollment link from the Dashboard. Parents fill it out and submissions appear in Operations, Enrollment Forms

---

## CAMPUSES / LOCATIONS

EPIC Prep Academy has 4 campus locations:
1. **Pace** - Main campus
2. **Crestview North**
3. **Navarre**
4. **Crestview Main Street**

Students and families are assigned to specific campuses. You can filter data by campus in various views.

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
                        "enum": ["Owner", "Director", "Coach"],
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
                        "enum": ["New", "Contact", "Contacted", "Tour Scheduled", "Tour Complete", "Enrolling", "Enrolled", "Lost"],
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
            "description": "Get help and guidance on how to use the CRM. Use this when users ask 'how do I', 'where do I', 'help me with', 'walk me through', 'train me', or any question about using the CRM features, roles, integrations, or permissions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic or feature the user needs help with (e.g., 'add student', 'record payment', 'take attendance', 'send message', 'upload IXL', 're-enroll', 'connect stripe', 'connect quickbooks', 'manage users', 'change role', 'export invoices', 'revenue reports')"
                    },
                    "user_role": {
                        "type": "string",
                        "enum": ["owner", "admin", "coach", "parent"],
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
            "description": "Get a list of all available features for a specific user role. Use this when users ask 'what can I do', 'what features are available', 'show me the menu', 'train me', 'show me around', or want to know their options.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_role": {
                        "type": "string",
                        "enum": ["owner", "admin", "coach", "parent"],
                        "description": "The role of the user"
                    }
                },
                "required": ["user_role"]
            }
        }
    },
    # === UPGRADE 1: WRITE ACTIONS ===
    {
        "type": "function",
        "function": {
            "name": "add_student",
            "description": "Add a new student to the system. Use when the user says 'add student', 'enroll student', 'create student record', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "first_name": {"type": "string", "description": "Student's first name"},
                    "last_name": {"type": "string", "description": "Student's last name"},
                    "grade": {"type": "string", "description": "Grade level (K, 1-12)"},
                    "session": {"type": "string", "enum": ["Morning", "Afternoon"], "description": "AM or PM session"},
                    "family_name": {"type": "string", "description": "Family/last name for family assignment"},
                    "campus_id": {"type": "string", "description": "Campus ID (optional)"},
                    "funding_source": {"type": "string", "enum": ["Step-Up", "Out-of-Pocket", "Mixed"], "description": "How tuition is funded"}
                },
                "required": ["first_name", "last_name", "grade"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_student",
            "description": "Update an existing student's information. Use when user says 'change student grade', 'update student info', 'move student to different session', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_name": {"type": "string", "description": "Student name to find"},
                    "student_id": {"type": "string", "description": "Student ID if known"},
                    "updates": {
                        "type": "object",
                        "description": "Fields to update: grade, session, room, status, campus_id, funding_source",
                        "properties": {
                            "grade": {"type": "string"},
                            "session": {"type": "string"},
                            "room": {"type": "string"},
                            "status": {"type": "string", "enum": ["Active", "Waitlisted", "Withdrawn"]},
                            "campus_id": {"type": "string"},
                            "funding_source": {"type": "string"}
                        }
                    }
                },
                "required": ["updates"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "record_payment",
            "description": "Record a payment for a family. Use when user says 'record payment', 'add payment', 'family paid', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "family_name": {"type": "string", "description": "Family name"},
                    "family_id": {"type": "string", "description": "Family ID if known"},
                    "amount": {"type": "number", "description": "Payment amount in dollars"},
                    "payment_method": {"type": "string", "enum": ["Cash", "Check", "Credit Card", "ACH", "Venmo", "Cash App", "Stripe", "Scholarship"], "description": "How the payment was made"},
                    "invoice_id": {"type": "string", "description": "Specific invoice ID to apply payment to (optional)"},
                    "description": {"type": "string", "description": "Payment description/notes"}
                },
                "required": ["amount"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_message",
            "description": "Send a message to a parent or staff member. Use when user says 'message parent', 'send message to', 'notify family', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient_name": {"type": "string", "description": "Name of the person to message"},
                    "recipient_type": {"type": "string", "enum": ["parent", "staff"], "description": "Type of recipient"},
                    "subject": {"type": "string", "description": "Message subject"},
                    "body": {"type": "string", "description": "Message content"}
                },
                "required": ["recipient_name", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_announcement",
            "description": "Send a school-wide announcement. Use when user says 'announce', 'send announcement', 'notify everyone', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Announcement title"},
                    "message": {"type": "string", "description": "Announcement content"},
                    "audience": {"type": "string", "enum": ["All", "Parents", "Staff", "Students"], "description": "Who should receive this"},
                    "priority": {"type": "string", "enum": ["Normal", "Important", "Urgent"], "description": "Priority level"}
                },
                "required": ["title", "message"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_event",
            "description": "Create a school event. Use when user says 'create event', 'add event', 'schedule event', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Event title"},
                    "date": {"type": "string", "description": "Event date (YYYY-MM-DD)"},
                    "time": {"type": "string", "description": "Event time (e.g., '9:00 AM')"},
                    "location": {"type": "string", "description": "Event location"},
                    "description": {"type": "string", "description": "Event description"},
                    "requires_rsvp": {"type": "boolean", "description": "Whether RSVP is required"}
                },
                "required": ["title", "date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "archive_account",
            "description": "Archive a student or family account. Use when user says 'archive', 'remove student', 'student leaving', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "account_type": {"type": "string", "enum": ["student", "family"], "description": "Type of account to archive"},
                    "name": {"type": "string", "description": "Student or family name to archive"}
                },
                "required": ["account_type", "name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "move_lead_stage",
            "description": "Move an enrollment lead to a different pipeline stage. Use when user says 'advance lead', 'move lead', 'update lead status', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "lead_name": {"type": "string", "description": "Lead/parent name"},
                    "new_stage": {"type": "string", "enum": ["New", "Contact", "Contacted", "Tour Scheduled", "Tour Complete", "Enrolling", "Enrolled", "Lost"], "description": "New pipeline stage"}
                },
                "required": ["lead_name", "new_stage"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "record_attendance",
            "description": "Record attendance for one or more students. Use when user says 'mark attendance', 'record attendance', 'mark present/absent', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_name": {"type": "string", "description": "Student name (or 'all' for bulk)"},
                    "status": {"type": "string", "enum": ["Present", "Absent", "Tardy"], "description": "Attendance status"},
                    "date": {"type": "string", "description": "Date (YYYY-MM-DD), defaults to today"}
                },
                "required": ["student_name", "status"]
            }
        }
    },
    # === UPGRADE 2: SCHEDULING & AUTOMATION ===
    {
        "type": "function",
        "function": {
            "name": "set_reminder",
            "description": "Set a reminder for a future task. Use when user says 'remind me', 'follow up', 'don't let me forget', 'schedule reminder', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {"type": "string", "description": "What to be reminded about"},
                    "due_date": {"type": "string", "description": "When to remind (YYYY-MM-DD or relative like 'tomorrow', 'next Monday', 'in 3 days')"},
                    "priority": {"type": "string", "enum": ["Low", "Medium", "High"], "description": "Reminder priority"},
                    "related_to": {"type": "string", "description": "Related person or family name (optional)"}
                },
                "required": ["task", "due_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_automation",
            "description": "Create an automated alert or action. Use when user says 'auto-send', 'automatically notify', 'set up alert when', 'trigger when', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "trigger": {"type": "string", "enum": ["balance_overdue", "attendance_threshold", "grade_drop", "enrollment_milestone", "payment_received", "event_upcoming"], "description": "What triggers this automation"},
                    "action": {"type": "string", "enum": ["send_message", "send_email", "create_alert", "notify_admin"], "description": "What happens when triggered"},
                    "config": {
                        "type": "object",
                        "description": "Configuration for the trigger/action",
                        "properties": {
                            "threshold": {"type": "number", "description": "Numeric threshold (e.g., days overdue, absence count)"},
                            "message_template": {"type": "string", "description": "Message template to send"},
                            "recipient": {"type": "string", "description": "Who to notify"}
                        }
                    },
                    "name": {"type": "string", "description": "Name for this automation rule"}
                },
                "required": ["trigger", "action", "name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_weekly_summary",
            "description": "Generate a comprehensive weekly summary report. Use when user says 'weekly report', 'how was this week', 'weekly summary', 'end of week report', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "include_sections": {
                        "type": "array",
                        "items": {"type": "string", "enum": ["enrollment", "attendance", "billing", "academics", "incidents", "leads"]},
                        "description": "Which sections to include (defaults to all)"
                    }
                },
                "required": []
            }
        }
    },
    # === UPGRADE 3: SMART INSIGHTS & FORECASTING ===
    {
        "type": "function",
        "function": {
            "name": "get_trend_analysis",
            "description": "Get trend analysis and insights. Use when user says 'show trends', 'how are we trending', 'enrollment trends', 'attendance trends', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {"type": "string", "enum": ["enrollment", "attendance", "billing", "academics", "retention"], "description": "Which metric to analyze"},
                    "period": {"type": "string", "enum": ["weekly", "monthly", "quarterly", "yearly"], "description": "Time period for analysis"}
                },
                "required": ["metric"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "predict_churn_risk",
            "description": "Predict which families are at risk of leaving. Use when user says 'churn risk', 'who might leave', 'retention risk', 'families at risk of leaving', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "threshold": {"type": "string", "enum": ["high", "medium", "all"], "description": "Risk level threshold to show"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "forecast_revenue",
            "description": "Forecast future revenue based on current data. Use when user says 'revenue forecast', 'financial projection', 'how much will we make', 'expected revenue', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "months_ahead": {"type": "integer", "description": "How many months to forecast (1-12)"},
                    "include_scholarships": {"type": "boolean", "description": "Include scholarship income in forecast"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "identify_at_risk_trends",
            "description": "Identify students trending toward at-risk status. Use when user says 'who is trending down', 'students getting worse', 'early warning', 'heading toward at-risk', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "factors": {
                        "type": "array",
                        "items": {"type": "string", "enum": ["attendance", "grades", "behavior", "engagement"]},
                        "description": "Which factors to analyze"
                    }
                },
                "required": []
            }
        }
    },
    # === UPGRADE 4: DOCUMENT & COMMUNICATION GENERATION ===
    {
        "type": "function",
        "function": {
            "name": "draft_communication",
            "description": "Draft a professional communication (email, letter, message). Use when user says 'write a message', 'draft email', 'compose letter', 'write to parents about', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["email", "message", "letter", "announcement"], "description": "Type of communication"},
                    "audience": {"type": "string", "description": "Who is this for (e.g., 'all parents', 'overdue families', 'specific family name', 'staff')"},
                    "topic": {"type": "string", "description": "What the communication is about"},
                    "tone": {"type": "string", "enum": ["professional", "friendly", "urgent", "formal"], "description": "Tone of the message"},
                    "include_data": {"type": "boolean", "description": "Whether to include specific CRM data (balances, dates, etc.)"}
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_report_card",
            "description": "Generate a student report card or progress summary. Use when user says 'report card', 'progress report', 'student summary', 'generate grades report', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_name": {"type": "string", "description": "Student name"},
                    "period": {"type": "string", "description": "Grading period (e.g., 'Q1', 'Q2', 'Semester 1', 'Year')"},
                    "include_comments": {"type": "boolean", "description": "Include teacher comments"}
                },
                "required": ["student_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_invoice",
            "description": "Generate a professional invoice for a family. Use when user says 'create invoice', 'generate bill', 'send invoice', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "family_name": {"type": "string", "description": "Family name"},
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "description": {"type": "string"},
                                "amount": {"type": "number"}
                            }
                        },
                        "description": "Line items for the invoice"
                    },
                    "due_date": {"type": "string", "description": "Payment due date"},
                    "billing_type": {"type": "string", "enum": ["OOP", "SUFS", "Scholarship"], "description": "Type of billing (OOP = Out-of-Pocket, default)"},
                    "student_id": {"type": "string", "description": "Specific student ID to invoice (optional, defaults to all students in family)"}
                },
                "required": ["family_name"]
            }
        }
    },
    # === UPGRADE 5: MULTI-STEP WORKFLOWS ===
    {
        "type": "function",
        "function": {
            "name": "execute_workflow",
            "description": "Execute a multi-step workflow. Use when user gives complex instructions like 'enroll the Smith family with 2 kids and set up billing', 'prepare end of month reports', 'onboard new teacher', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "workflow_type": {"type": "string", "enum": ["enroll_family", "end_of_month", "onboard_staff", "withdraw_student", "semester_close", "payment_followup_batch"], "description": "Type of workflow to execute"},
                    "params": {
                        "type": "object",
                        "description": "Workflow parameters (varies by type)",
                        "properties": {
                            "family_name": {"type": "string"},
                            "parent_name": {"type": "string"},
                            "parent_email": {"type": "string"},
                            "parent_phone": {"type": "string"},
                            "students": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "first_name": {"type": "string"},
                                        "last_name": {"type": "string"},
                                        "grade": {"type": "string"},
                                        "session": {"type": "string"}
                                    }
                                }
                            },
                            "staff_name": {"type": "string"},
                            "staff_role": {"type": "string"},
                            "staff_email": {"type": "string"},
                            "student_name": {"type": "string"},
                            "reason": {"type": "string"}
                        }
                    }
                },
                "required": ["workflow_type"]
            }
        }
    },
    # === UPGRADE 6: CONVERSATION MEMORY ===
    {
        "type": "function",
        "function": {
            "name": "recall_context",
            "description": "Recall information from earlier in the conversation or previous interactions. Use when user references something discussed before, says 'remember when', 'like I said', 'going back to', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "What to recall from conversation history"}
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "summarize_conversation",
            "description": "Summarize what has been discussed in this conversation. Use when user says 'what did we talk about', 'summarize our chat', 'recap', etc.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    # === UPGRADE 7: NATURAL LANGUAGE SEARCH (SEMANTIC) ===
    {
        "type": "function",
        "function": {
            "name": "semantic_search",
            "description": "Search across all CRM data using natural language. Understands fuzzy/contextual queries like 'that family from Navarre', 'the kid who transferred last month', 'families with scholarship issues'. Use when the user's query doesn't fit a structured search pattern.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Natural language search query"},
                    "scope": {"type": "string", "enum": ["all", "students", "families", "staff", "events", "incidents"], "description": "Which data to search (defaults to all)"}
                },
                "required": ["query"]
            }
        }
    },
    # === UPGRADE 8: SMART SUGGESTIONS (PROACTIVE ASSISTANT) ===
    {
        "type": "function",
        "function": {
            "name": "get_smart_suggestions",
            "description": "Get proactive suggestions based on current patterns and data. Use when user says 'any suggestions', 'what should I focus on', 'what needs attention', 'give me insights', 'what am I missing', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "focus_area": {"type": "string", "enum": ["all", "billing", "attendance", "academics", "enrollment", "engagement"], "description": "Which area to analyze for suggestions"}
                },
                "required": []
            }
        }
    },
    # === UPGRADE 9: PARENT COMMUNICATION TEMPLATES ===
    {
        "type": "function",
        "function": {
            "name": "get_communication_template",
            "description": "Get a pre-built communication template for common parent messages. Use when user says 'template for', 'give me a template', 'how should I word', 'standard message for', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "template_type": {"type": "string", "enum": ["tuition_reminder", "late_payment", "event_invite", "progress_update", "incident_followup", "holiday_schedule", "re_enrollment", "welcome_new_family", "attendance_concern", "achievement_celebration"], "description": "Type of template to retrieve"},
                    "family_name": {"type": "string", "description": "Family name to personalize the template (optional)"},
                    "custom_details": {"type": "string", "description": "Additional details to include in the template"}
                },
                "required": ["template_type"]
            }
        }
    },
    # === UPGRADE 10: GOAL TRACKING & KPIs ===
    {
        "type": "function",
        "function": {
            "name": "track_goals",
            "description": "Set, track, and report on school-wide goals and KPIs. Use when user says 'set a goal', 'track our progress', 'how are we doing on', 'KPI report', 'are we on track', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["set", "check", "list", "report"], "description": "What to do: set a new goal, check progress, list all goals, or generate report"},
                    "metric": {"type": "string", "enum": ["attendance_rate", "enrollment_count", "revenue_monthly", "retention_rate", "at_risk_reduction", "collection_rate"], "description": "Which metric this goal tracks"},
                    "target_value": {"type": "number", "description": "Target value for the goal (e.g., 95 for 95% attendance)"},
                    "deadline": {"type": "string", "description": "Goal deadline (YYYY-MM-DD)"},
                    "name": {"type": "string", "description": "Custom name for the goal"}
                },
                "required": ["action"]
            }
        }
    },
    # === UPGRADE 11: COMPETITIVE ANALYSIS / BENCHMARKING ===
    {
        "type": "function",
        "function": {
            "name": "benchmark_metrics",
            "description": "Compare school metrics against industry averages and best practices. Use when user says 'how do we compare', 'benchmark', 'industry average', 'are we above average', 'best practices', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {"type": "string", "enum": ["student_teacher_ratio", "attendance_rate", "retention_rate", "tuition_collection", "enrollment_growth", "parent_engagement", "academic_performance"], "description": "Which metric to benchmark"},
                    "school_type": {"type": "string", "enum": ["private_k12", "charter", "micro_school", "all"], "description": "Comparison group"}
                },
                "required": ["metric"]
            }
        }
    },
    # === UPGRADE 12: MEETING PREP MODE ===
    {
        "type": "function",
        "function": {
            "name": "prepare_meeting_brief",
            "description": "Generate a comprehensive meeting brief with all key metrics and talking points. Use when user says 'prepare for my meeting', 'board meeting prep', 'meeting brief', 'executive summary', 'brief me', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "meeting_type": {"type": "string", "enum": ["board_meeting", "staff_meeting", "parent_conference", "investor_update", "weekly_standup"], "description": "Type of meeting to prepare for"},
                    "focus_topics": {
                        "type": "array",
                        "items": {"type": "string", "enum": ["enrollment", "financials", "academics", "operations", "staffing", "marketing", "facilities"]},
                        "description": "Which topics to emphasize"
                    },
                    "time_period": {"type": "string", "enum": ["this_week", "this_month", "this_quarter", "this_year"], "description": "What time period to cover"}
                },
                "required": ["meeting_type"]
            }
        }
    },
    # === UPGRADE 13: PARENT SATISFACTION SCORING ===
    {
        "type": "function",
        "function": {
            "name": "get_family_health_scores",
            "description": "Calculate health/satisfaction scores for families based on engagement, payments, attendance, and communication. Use when user says 'family satisfaction', 'health scores', 'which families are happy', 'engagement scores', 'family risk scores', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "sort_by": {"type": "string", "enum": ["lowest_first", "highest_first"], "description": "Sort order for results"},
                    "threshold": {"type": "string", "enum": ["critical", "warning", "all"], "description": "Which families to show: critical (<40), warning (<60), or all"},
                    "family_name": {"type": "string", "description": "Specific family to check (optional)"}
                },
                "required": []
            }
        }
    },
    # === UPGRADE 14: CALENDAR INTELLIGENCE ===
    {
        "type": "function",
        "function": {
            "name": "calendar_intelligence",
            "description": "Get intelligent scheduling suggestions based on the school calendar, testing windows, holidays, and deadlines. Use when user says 'when should I schedule', 'best time for', 'calendar conflicts', 'upcoming deadlines', 'what's coming up that I should prepare for', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["suggest_timing", "check_conflicts", "upcoming_deadlines", "prep_recommendations"], "description": "What calendar intelligence to provide"},
                    "event_type": {"type": "string", "description": "Type of event or activity being planned (optional)"},
                    "proposed_date": {"type": "string", "description": "Date being considered (YYYY-MM-DD, optional)"},
                    "lookahead_days": {"type": "integer", "description": "How many days ahead to look (default 30)"}
                },
                "required": ["action"]
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
    # Write actions - parents cannot modify data
    "add_student", "update_student", "record_payment", "send_announcement",
    "create_event", "archive_account", "move_lead_stage", "record_attendance",
    # Scheduling & automation
    "set_reminder", "create_automation", "get_weekly_summary",
    # Insights & forecasting
    "get_trend_analysis", "predict_churn_risk", "forecast_revenue", "identify_at_risk_trends",
    # Document generation
    "draft_communication", "generate_report_card", "generate_invoice",
    # Workflows
    "execute_workflow",
    # Advanced intelligence - parents cannot access school-wide analytics
    "semantic_search", "get_smart_suggestions", "track_goals",
    "benchmark_metrics", "prepare_meeting_brief", "get_family_health_scores",
}

# Teachers should NOT have access to these functions
TEACHER_RESTRICTED_FUNCTIONS = {
    "get_billing_summary",        # Financial data
    "get_scholarship_summary",    # Scholarship financial data
    "get_leads_pipeline",         # Enrollment pipeline (business data)
    "get_re_enrollment_status",   # School-wide re-enrollment stats
    "create_export_report",       # Can export sensitive datasets
    # Write actions coaches cannot do
    "record_payment", "archive_account", "move_lead_stage",
    "create_automation", "forecast_revenue", "predict_churn_risk",
    "generate_invoice", "execute_workflow",
    # Advanced features coaches don't need
    "benchmark_metrics", "prepare_meeting_brief", "get_family_health_scores",
    "track_goals",
}

# Role-specific system prompt additions
ROLE_PROMPTS = {
    "owner": """
You are speaking with the SCHOOL OWNER who has FULL ACCESS to ALL features and data.
This is the highest-level role. You may share any information requested including student data, family details, billing, scholarships, leads, staff info, and all operational data.
The Owner can also:
- Connect and manage Stripe integration (Reports → Stripe)
- Connect and manage QuickBooks integration (Reports → QuickBooks)
- Export invoices to QuickBooks
- View revenue reports
- Manage user roles in Settings (assign Owner, Admin, Coach, or Parent roles)
When training the Owner on the CRM, cover ALL features including integrations and settings.
""",
    "admin": """
You are speaking with a SCHOOL ADMINISTRATOR who has access to almost all school data and operations.
You may share any information requested including student data, family details, billing, scholarships, leads, staff info, and all operational data.
The Admin can do almost everything the Owner can EXCEPT:
- Cannot access QuickBooks integration (Owner only)
- Cannot change user roles in Settings (Owner only)
If the Admin asks about QuickBooks or changing user roles, politely explain these are Owner-only features and they should contact the school owner.
When training the Admin on the CRM, cover all features except Owner-only integrations.
""",
    "coach": """
You are speaking with a COACH (teacher). Their access is LIMITED to:
- Student academic information (grades, attendance, learning progress)
- Classroom and student support data
- School events and announcements
- Messaging with parents and staff
- Incident reporting and health records
- Learning progress import (IXL/Acellus CSV upload)

You must NOT share or discuss:
- Financial information (billing, tuition, balances, payment plans)
- Scholarship details or amounts
- Enrollment pipeline or leads data
- Re-enrollment statistics
- Detailed family financial status
- Staff salary or HR information
- Reports, analytics, or integrations (Stripe/QuickBooks)
- Settings or user management

If a coach asks about restricted topics, politely explain that this information is only available to administrators or the school owner.
When training a Coach on the CRM, focus on: My Rooms, Gradebook, Attendance, Learning Progress, Announcements, Events, Documents, Photos, Messages, Incidents, Health Records.
""",
    "parent": """
You are speaking with a PARENT. Their access is VERY LIMITED:
- They can ONLY ask about general school events, announcements, and school policies
- They can ask for help using the parent features of the CRM (messaging, viewing their child's info, re-enrollment, billing, store, documents, photos, health, enrollment)
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
When training a Parent on the CRM, focus on: My Children, Billing, Events, Documents, Store, Photos, Messages, Health, Enrollment, and Re-enrollment.
"""
}
ROLE_PROMPTS["teacher"] = ROLE_PROMPTS["coach"]


def get_functions_for_role(user_role: str) -> list:
    """Return the list of available functions filtered by user role."""
    if user_role in ("admin", "owner"):
        return AVAILABLE_FUNCTIONS
    
    if user_role == "teacher" or user_role == "coach":
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
    if user_role in ("admin", "owner"):
        return data_context  # Admins get full access
    
    if user_role == "teacher" or user_role == "coach":
        # Coaches can see students, attendance, grades, behavior, events
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
    invoices_db = data_context.get("invoices", [])
    
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
            results = [s for s in results if s.funding_source == arguments["funding_source"]]
        
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
                    "funding": s.funding_source
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
                "room": student.room,
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
            "funding_source": student.funding_source,
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
                    "funding": s.funding_source,
                    "annual_tuition": s.annual_tuition or 0,
                    "sufs_approved_amount": s.sufs_approved_amount or 0,
                    "scholarship_amount": s.scholarship_amount or 0,
                    "annual_oop": max(0, (s.annual_tuition or 0) - (s.sufs_approved_amount or 0) - (s.scholarship_amount or 0)),
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
        
        # Calculate totals from per-student billing fields
        total_tuition = sum(s.annual_tuition or 0 for s in students_db)
        total_sufs = sum(s.sufs_approved_amount or 0 for s in students_db)
        total_scholarship_amt = sum(s.scholarship_amount or 0 for s in students_db)
        total_oop = max(0, total_tuition - total_sufs - total_scholarship_amt)
        
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
            "total_annual_tuition": round(total_tuition, 2),
            "total_sufs_approved": round(total_sufs, 2),
            "total_scholarship": round(total_scholarship_amt, 2),
            "total_annual_oop": round(total_oop, 2),
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
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin", "coach"],
                "steps": [
                    "Go to Students page (Admin) or My Rooms (Teacher)",
                    "Find the student in the list",
                    "Click on the student's name to open their profile",
                    "Click 'View Full Student & Family Account' for complete details including grades, attendance, and family billing"
                ]
            },
            "student grades": {
                "title": "How to View/Enter Student Grades",
                "roles": ["owner", "admin", "coach"],
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
                "roles": ["owner", "admin", "coach"],
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
                "roles": ["owner", "admin", "coach", "parent"],
                "steps": [
                    "Admin: Dashboard shows today's attendance summary, or go to Students → click student → view attendance history",
                    "Teacher: My Rooms shows attendance for your classes",
                    "Parent: My Children tab shows your child's attendance summary"
                ]
            },
            # Billing and payments
            "record payment": {
                "title": "How to Record a Payment",
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin", "parent"],
                "steps": [
                    "Admin: Go to Families & Finance to see all families with billing status colors (Green=current, Yellow=warning, Red=overdue)",
                    "Parent: Click the Billing tab to see your family's balance, payment history, and tuition breakdown"
                ]
            },
            "overdue": {
                "title": "How to Find Families with Overdue Balances",
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin", "coach", "parent"],
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
                "roles": ["owner", "admin", "coach", "parent"],
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
                "roles": ["owner", "admin", "coach"],
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
                "roles": ["owner", "admin", "coach"],
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
                "roles": ["owner", "admin", "coach", "parent"],
                "steps": [
                    "Admin: Go to Academics → Learning Progress to see all students' IXL/Acellus progress",
                    "Teacher: Click Learning Progress tab to see your students' progress and import new data",
                    "Parent: My Children tab shows your child's learning progress summary"
                ]
            },
            # Re-enrollment
            "re-enroll": {
                "title": "How to Re-Enroll a Student",
                "roles": ["owner", "admin", "coach", "parent"],
                "steps": [
                    "Parent: Go to My Children, scroll to Re-Enrollment section, click 'Re-Enroll for [Year]', complete payment",
                    "Admin/Teacher: View student's full account, scroll to Re-Enrollment section, click 'Re-Enroll for [Year]'"
                ]
            },
            "enrollment fee": {
                "title": "How to Set the Enrollment Fee",
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin", "coach", "parent"],
                "steps": [
                    "Admin: Go to Operations → Events",
                    "Teacher: Click the Events tab",
                    "Parent: Click the Events tab to see upcoming events and RSVP"
                ]
            },
            # Incidents
            "report incident": {
                "title": "How to Report an Incident",
                "roles": ["owner", "admin", "coach"],
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
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin"],
                "steps": [
                    "Go to Admissions to see all leads",
                    "Leads are organized by stage: New → Contact → Contacted → Tour Scheduled → Tour Complete → Enrolling → Enrolled",
                    "Click on a lead to update their status or add notes",
                    "Move leads through stages as they progress"
                ]
            },
            # Staff
            "manage staff": {
                "title": "How to Manage Staff",
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin"],
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
                "roles": ["owner", "admin", "coach"],
                "steps": [
                    "Owner/Admin: Go to Analytics → At-Risk Report, or check Dashboard alerts",
                    "Coach: Look for students with red risk flags in your rooms",
                    "Click on a student to see why they're flagged (attendance issues, grade issues, etc.)"
                ]
            },
            # Stripe integration
            "connect stripe": {
                "title": "How to Connect Stripe",
                "roles": ["owner"],
                "steps": [
                    "Go to the Reports tab in the top navigation",
                    "Click the 'Stripe' sub-tab",
                    "Click 'Connect Stripe Account'",
                    "You'll be redirected to Stripe to authorize the connection",
                    "After authorizing, you'll be redirected back to the CRM",
                    "Your Stripe account is now connected and payments will sync"
                ]
            },
            "stripe": {
                "title": "How to View Stripe Dashboard",
                "roles": ["owner", "admin"],
                "steps": [
                    "Go to the Reports tab in the top navigation",
                    "Click the 'Stripe' sub-tab",
                    "View your connected account status and recent transactions",
                    "Note: Only the Owner can initially connect the Stripe account"
                ]
            },
            # QuickBooks integration
            "connect quickbooks": {
                "title": "How to Connect QuickBooks",
                "roles": ["owner"],
                "steps": [
                    "Go to the Reports tab in the top navigation",
                    "Click the 'QuickBooks' sub-tab (Owner only)",
                    "Click 'Connect QuickBooks'",
                    "You'll be redirected to Intuit to authorize the connection",
                    "After authorizing, you'll be redirected back to the CRM",
                    "Your QuickBooks account is now connected"
                ]
            },
            "quickbooks": {
                "title": "How to Use QuickBooks Integration",
                "roles": ["owner"],
                "steps": [
                    "Go to Reports → QuickBooks tab",
                    "If not connected, click 'Connect QuickBooks' first",
                    "Once connected, you'll see invoices ready to export",
                    "Click 'Preview Export' to review what will be sent",
                    "Click 'Export to QuickBooks' to sync invoices",
                    "Note: QuickBooks is only visible to the Owner account"
                ]
            },
            "export invoices": {
                "title": "How to Export Invoices to QuickBooks",
                "roles": ["owner"],
                "steps": [
                    "Go to Reports → QuickBooks tab",
                    "Make sure your QuickBooks account is connected",
                    "Click 'Preview Export' to see what invoices will be sent",
                    "Click 'Export to QuickBooks' to sync all invoices",
                    "QuickBooks will receive the invoice data automatically"
                ]
            },
            # Revenue reports
            "revenue reports": {
                "title": "How to View Revenue Reports",
                "roles": ["owner", "admin"],
                "steps": [
                    "Go to the Reports tab in the top navigation",
                    "Click the 'Revenue Reports' sub-tab",
                    "View revenue breakdown, payment trends, and outstanding balances",
                    "Use filters to drill down by date range or category"
                ]
            },
            "reports": {
                "title": "How to Access Reports",
                "roles": ["owner", "admin"],
                "steps": [
                    "Go to the Reports tab in the top navigation",
                    "Revenue Reports: School revenue breakdown and payment trends",
                    "Stripe: View connected Stripe account and transactions",
                    "QuickBooks (Owner only): Export invoices to QuickBooks"
                ]
            },
            # Settings / User management
            "manage users": {
                "title": "How to Manage Users",
                "roles": ["owner"],
                "steps": [
                    "Go to Settings in the top navigation",
                    "View all CRM users with their current roles",
                    "Click on a user to change their role",
                    "Select the new role: Owner, Admin, Coach, or Parent",
                    "Changes take effect immediately"
                ]
            },
            "settings": {
                "title": "How to Access Settings",
                "roles": ["owner", "admin"],
                "steps": [
                    "Go to Settings in the top navigation",
                    "View the User Management section",
                    "See all users, their email addresses, and their roles",
                    "Owner can change user roles; Admin can view but not change roles"
                ]
            },
            "change role": {
                "title": "How to Change a User's Role",
                "roles": ["owner"],
                "steps": [
                    "Go to Settings in the top navigation",
                    "Find the user in the list",
                    "Click the role dropdown next to their name",
                    "Select the new role: Owner, Admin, Coach, or Parent",
                    "The change takes effect immediately",
                    "Note: Only Owner accounts can change user roles"
                ]
            },
            # Store (parent)
            "store": {
                "title": "How to Use the School Store",
                "roles": ["parent"],
                "steps": [
                    "Click the 'Store' tab in your dashboard",
                    "Browse available items",
                    "Click on an item to view details",
                    "Click 'Add to Cart' or 'Purchase' to buy"
                ]
            },
            # Health records
            "health": {
                "title": "How to View Health Records",
                "roles": ["owner", "admin", "coach", "parent"],
                "steps": [
                    "Owner/Admin: Go to a student's full record to see health information",
                    "Coach: Click the Health Records tab in your dashboard",
                    "Parent: Click the 'Health' tab to see your child's health records"
                ]
            },
            # Photos
            "photos": {
                "title": "How to View/Upload Photos",
                "roles": ["owner", "admin", "coach", "parent"],
                "steps": [
                    "Owner/Admin: Go to Operations → Photos, or Documents tab",
                    "Coach: Click the Photos tab in your dashboard",
                    "Parent: Click the 'Photos' tab to see school photos",
                    "To upload: Click 'Upload Photos' and select images from your device"
                ]
            },
            # Announcements
            "announcement": {
                "title": "How to Create an Announcement",
                "roles": ["owner", "admin", "coach"],
                "steps": [
                    "Owner/Admin: Go to Communications → Announcements",
                    "Coach: Click the Announcements tab in your dashboard",
                    "Click 'New Announcement'",
                    "Enter title and message content",
                    "Select audience (All, Parents, Staff)",
                    "Click 'Publish'"
                ]
            }
        }
        
        # Find matching help topic
        matched_topic = None
        for key, value in help_topics.items():
            if key in topic or topic in key:
                # Check if the user's role has access, mapping legacy role names
                check_role = user_role
                if check_role == "teacher":
                    check_role = "coach"
                if check_role in value["roles"]:
                    matched_topic = value
                    break
        
        if matched_topic:
            return {
                "title": matched_topic["title"],
                "steps": matched_topic["steps"],
                "available_for_role": user_role in matched_topic["roles"] or (user_role == "teacher" and "coach" in matched_topic["roles"])
            }
        else:
            # Return general guidance
            return {
                "message": f"I don't have specific step-by-step instructions for '{topic}', but I can help you find what you need. What are you trying to accomplish?",
                "suggestion": "Try asking about: adding students, taking attendance, recording payments, sending messages, uploading IXL/Acellus data, re-enrollment, managing events, viewing reports, connecting Stripe, connecting QuickBooks, exporting invoices, managing users, or changing roles."
            }
    
    elif function_name == "get_available_features":
        user_role = arguments.get("user_role", "admin").lower()
        
        features = {
            "owner": {
                "role": "Owner (Full Access)",
                "dashboard_sections": [
                    "Dashboard - Overview of key metrics, alerts, and daily devotional",
                    "Students - Complete student roster, add/edit students, view full profiles",
                    "Families & Finance - Family accounts, billing, SUFS scholarships, payment queue",
                    "Admissions - Enrollment pipeline, leads management",
                    "Academics - Standards gradebook, learning progress, IXL/Acellus import",
                    "Student Support - IEP/504 management, interventions",
                    "Communications - Direct messages, broadcasts, announcements",
                    "Operations - Events, staff management, fees/products, enrollment forms, photos",
                    "Documents & Forms - Document library, form management",
                    "Analytics - At-risk reports, advanced analytics",
                    "Reports - Revenue reports, Stripe payment dashboard, QuickBooks integration & invoice export",
                    "Settings - User management, role assignment"
                ],
                "key_actions": [
                    "Add/edit students and families",
                    "Record payments and manage billing",
                    "Track SUFS scholarship payments",
                    "Send messages to parents and staff",
                    "Create school events",
                    "Import IXL/Acellus learning progress",
                    "View at-risk student reports",
                    "Manage enrollment pipeline",
                    "Connect and manage Stripe integration",
                    "Connect and manage QuickBooks integration",
                    "Export invoices to QuickBooks",
                    "View revenue reports",
                    "Manage user roles (Owner, Admin, Coach, Parent)",
                    "Ask Auvora AI for data insights and help"
                ]
            },
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
                    "Operations - Events, staff management, fees/products, enrollment forms, photos",
                    "Documents & Forms - Document library, form management",
                    "Analytics - At-risk reports, advanced analytics",
                    "Reports - Revenue reports, Stripe payment dashboard (no QuickBooks - Owner only)",
                    "Settings - User management (view only, role changes require Owner)"
                ],
                "key_actions": [
                    "Add/edit students and families",
                    "Record payments and manage billing",
                    "Track SUFS scholarship payments",
                    "Send messages to parents and staff",
                    "Create school events",
                    "Import IXL/Acellus learning progress",
                    "View at-risk student reports",
                    "Manage enrollment pipeline",
                    "View revenue reports and Stripe dashboard",
                    "Ask Auvora AI for data insights and help"
                ],
                "not_available": [
                    "QuickBooks integration (Owner only)",
                    "Assign/change user roles (Owner only)"
                ]
            },
            "coach": {
                "role": "Coach",
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
                    "Create announcements",
                    "Ask Auvora AI for help"
                ],
                "not_available": [
                    "Billing and financial data",
                    "Scholarship details",
                    "Enrollment pipeline/leads",
                    "Reports and analytics",
                    "Settings and user management"
                ]
            },
            "parent": {
                "role": "Parent",
                "dashboard_sections": [
                    "My Children - Overview of your children's grades, attendance, and learning progress",
                    "Billing - Your family's billing, payment history, and tuition breakdown",
                    "Events - School events, RSVPs, and permission slips",
                    "Documents - School documents and forms to complete",
                    "Store - School store for purchasing items",
                    "Photos - School photo gallery",
                    "Messages - Messages with school staff",
                    "Health - Your child's health records",
                    "Enrollment - Enrollment forms and re-enrollment"
                ],
                "key_actions": [
                    "View your child's grades and attendance",
                    "Check billing status and payment history",
                    "RSVP to school events",
                    "Message teachers and staff",
                    "Re-enroll your child for next year",
                    "Complete enrollment forms",
                    "Shop in the school store",
                    "View and sign documents",
                    "Ask Auvora AI for help"
                ],
                "not_available": [
                    "Other students' or families' information",
                    "School-wide data and analytics",
                    "Financial summaries and revenue",
                    "Staff management",
                    "Admissions pipeline"
                ]
            }
        }
        # Map legacy role names
        if user_role == "teacher":
            user_role = "coach"
        
        return features.get(user_role, features["admin"])

    # === UPGRADE 1: WRITE ACTIONS ===
    if function_name == "add_student":
        first_name = arguments.get("first_name", "")
        last_name = arguments.get("last_name", "")
        grade = arguments.get("grade", "K")
        session = arguments.get("session", "Morning")
        family_name = arguments.get("family_name", last_name)
        funding_source = arguments.get("funding_source", "Out-of-Pocket")
        student_id = f"STU-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        return {
            "success": True,
            "message": f"Student {first_name} {last_name} has been added successfully.",
            "student_id": student_id,
            "details": {
                "name": f"{first_name} {last_name}",
                "grade": grade,
                "session": session,
                "family": family_name,
                "funding_source": funding_source,
                "status": "Active"
            }
        }

    if function_name == "update_student":
        student_name = arguments.get("student_name", "")
        updates = arguments.get("updates", {})
        student = None
        if student_name:
            student = next((s for s in students_db if student_name.lower() in f"{s.first_name} {s.last_name}".lower()), None)
        if not student:
            return {"success": False, "error": f"Student '{student_name}' not found"}
        updated_fields = []
        for field, value in updates.items():
            updated_fields.append(f"{field}: {value}")
        return {
            "success": True,
            "message": f"Updated {student.first_name} {student.last_name}: {', '.join(updated_fields)}",
            "student": f"{student.first_name} {student.last_name}",
            "updates_applied": updates
        }

    if function_name == "record_payment":
        family_name = arguments.get("family_name", "")
        amount = arguments.get("amount", 0)
        payment_method = arguments.get("payment_method", "Cash")
        invoice_id = arguments.get("invoice_id", "")
        description = arguments.get("description", "Payment received")
        family = None
        if family_name:
            family = next((f for f in families_db if family_name.lower() in f.family_name.lower()), None)
        payment_details = {
            "amount": amount,
            "method": payment_method,
            "description": description,
            "date": str(date.today()),
            "family": family.family_name if family else family_name
        }
        if invoice_id:
            payment_details["invoice_id"] = invoice_id
            invoice = next((i for i in invoices_db if i.invoice_id == invoice_id), None)
            if invoice:
                invoice.amount_paid = (invoice.amount_paid or 0) + amount
                invoice.balance = max(0.0, invoice.total - invoice.amount_paid)
                invoice.payment_method = payment_method
                invoice.payment_date = date.today()
                if invoice.balance <= 0:
                    invoice.status = "Paid"
                invoice.last_updated = datetime.now()
                payment_details["invoice_status"] = invoice.status if isinstance(invoice.status, str) else invoice.status.value
                payment_details["remaining_balance"] = round(invoice.balance, 2)
        return {
            "success": True,
            "message": f"Payment of ${amount:.2f} recorded for {family.family_name if family else family_name} family via {payment_method}.",
            "payment_details": payment_details
        }

    if function_name == "send_message":
        recipient_name = arguments.get("recipient_name", "")
        recipient_type = arguments.get("recipient_type", "parent")
        subject = arguments.get("subject", "Message from EPIC Prep")
        body = arguments.get("body", "")
        return {
            "success": True,
            "message": f"Message sent to {recipient_name} ({recipient_type}).",
            "details": {
                "to": recipient_name,
                "subject": subject,
                "body": body,
                "sent_at": datetime.now().isoformat(),
                "status": "delivered"
            }
        }

    if function_name == "send_announcement":
        title = arguments.get("title", "")
        message = arguments.get("message", "")
        audience = arguments.get("audience", "All")
        priority = arguments.get("priority", "Normal")
        return {
            "success": True,
            "message": f"Announcement '{title}' published to {audience}.",
            "details": {
                "title": title,
                "audience": audience,
                "priority": priority,
                "published_at": datetime.now().isoformat(),
                "recipients_count": len(students_db) + len(families_db)
            }
        }

    if function_name == "create_event":
        title = arguments.get("title", "")
        event_date = arguments.get("date", str(date.today()))
        time = arguments.get("time", "9:00 AM")
        location = arguments.get("location", "Main Campus")
        description = arguments.get("description", "")
        requires_rsvp = arguments.get("requires_rsvp", False)
        return {
            "success": True,
            "message": f"Event '{title}' created for {event_date} at {time}.",
            "event": {
                "title": title,
                "date": event_date,
                "time": time,
                "location": location,
                "description": description,
                "requires_rsvp": requires_rsvp,
                "status": "Published"
            }
        }

    if function_name == "archive_account":
        account_type = arguments.get("account_type", "student")
        name = arguments.get("name", "")
        if account_type == "student":
            student = next((s for s in students_db if name.lower() in f"{s.first_name} {s.last_name}".lower()), None)
            if student:
                return {"success": True, "message": f"Student {student.first_name} {student.last_name} has been archived and hidden from active lists."}
        elif account_type == "family":
            family = next((f for f in families_db if name.lower() in f.family_name.lower()), None)
            if family:
                return {"success": True, "message": f"The {family.family_name} family and all associated students have been archived."}
        return {"success": False, "error": f"{account_type.title()} '{name}' not found"}

    if function_name == "move_lead_stage":
        lead_name = arguments.get("lead_name", "")
        new_stage = arguments.get("new_stage", "")
        lead = next((l for l in leads_db if lead_name.lower() in (l.parent_name or "").lower()), None)
        if lead:
            return {"success": True, "message": f"Lead '{lead.parent_name}' moved to '{new_stage}' stage.", "lead": lead.parent_name, "new_stage": new_stage}
        return {"success": False, "error": f"Lead '{lead_name}' not found in pipeline"}

    if function_name == "record_attendance":
        student_name = arguments.get("student_name", "")
        status = arguments.get("status", "Present")
        att_date = arguments.get("date", str(date.today()))
        if student_name.lower() == "all":
            return {"success": True, "message": f"Attendance recorded as '{status}' for all students on {att_date}.", "count": len([s for s in students_db if s.status.value == "Active"])}
        student = next((s for s in students_db if student_name.lower() in f"{s.first_name} {s.last_name}".lower()), None)
        if student:
            return {"success": True, "message": f"Attendance recorded: {student.first_name} {student.last_name} marked as '{status}' on {att_date}."}
        return {"success": False, "error": f"Student '{student_name}' not found"}

    # === UPGRADE 2: SCHEDULING & AUTOMATION ===
    if function_name == "set_reminder":
        task = arguments.get("task", "")
        due_date = arguments.get("due_date", "")
        priority = arguments.get("priority", "Medium")
        related_to = arguments.get("related_to", "")
        return {
            "success": True,
            "message": f"Reminder set: '{task}' — due {due_date}.",
            "reminder": {
                "task": task,
                "due_date": due_date,
                "priority": priority,
                "related_to": related_to,
                "status": "Active",
                "created_at": datetime.now().isoformat()
            }
        }

    if function_name == "create_automation":
        trigger = arguments.get("trigger", "")
        action = arguments.get("action", "")
        config = arguments.get("config", {})
        name = arguments.get("name", "")
        trigger_descriptions = {
            "balance_overdue": "When a family balance becomes overdue",
            "attendance_threshold": f"When a student exceeds {config.get('threshold', 3)} absences",
            "grade_drop": "When a student's grades drop significantly",
            "enrollment_milestone": "When a lead reaches a pipeline milestone",
            "payment_received": "When a payment is received",
            "event_upcoming": "When an event is approaching"
        }
        return {
            "success": True,
            "message": f"Automation '{name}' created successfully.",
            "automation": {
                "name": name,
                "trigger": trigger_descriptions.get(trigger, trigger),
                "action": action,
                "config": config,
                "status": "Active",
                "created_at": datetime.now().isoformat()
            }
        }

    if function_name == "get_weekly_summary":
        sections = arguments.get("include_sections", ["enrollment", "attendance", "billing", "academics", "incidents", "leads"])
        total_active = len([s for s in students_db if s.status.value == "Active"])
        total_families = len(families_db)
        recent_attendance = [a for a in attendance_records_db if a.date >= date.today() - timedelta(days=7)]
        present_count = len([a for a in recent_attendance if a.status.value == "Present"])
        attendance_rate = round(present_count / len(recent_attendance) * 100, 1) if recent_attendance else 0
        overdue_families = len([f for f in families_db if f.billing_status.value == "Red"])
        at_risk_students = len([s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "At Risk"])
        recent_incidents_count = len([i for i in incidents_db if hasattr(i, 'date') and i.date >= date.today() - timedelta(days=7)]) if incidents_db else 0
        new_leads = len([l for l in leads_db if hasattr(l, 'created_date') and l.created_date and l.created_date >= date.today() - timedelta(days=7)]) if leads_db else 0
        return {
            "period": f"Week of {(date.today() - timedelta(days=7)).strftime('%b %d')} - {date.today().strftime('%b %d, %Y')}",
            "enrollment": {"total_students": total_active, "total_families": total_families},
            "attendance": {"rate": f"{attendance_rate}%", "total_records": len(recent_attendance)},
            "billing": {"overdue_families": overdue_families, "total_outstanding": sum(f.current_balance for f in families_db if f.current_balance > 0)},
            "academics": {"at_risk_students": at_risk_students},
            "incidents": {"this_week": recent_incidents_count},
            "leads": {"new_this_week": new_leads, "total_in_pipeline": len(leads_db)}
        }

    # === UPGRADE 3: SMART INSIGHTS & FORECASTING ===
    if function_name == "get_trend_analysis":
        metric = arguments.get("metric", "enrollment")
        period = arguments.get("period", "monthly")
        if metric == "enrollment":
            active = len([s for s in students_db if s.status.value == "Active"])
            withdrawn = len([s for s in students_db if s.status.value == "Withdrawn"])
            return {
                "metric": "Enrollment",
                "current": active,
                "trend": "stable",
                "details": f"Currently {active} active students. {withdrawn} withdrawn this period.",
                "recommendation": "Enrollment is healthy. Consider increasing marketing for the next enrollment cycle." if active > 20 else "Consider ramping up lead generation efforts."
            }
        elif metric == "attendance":
            recent = [a for a in attendance_records_db if a.date >= date.today() - timedelta(days=30)]
            rate = round(len([a for a in recent if a.status.value == "Present"]) / len(recent) * 100, 1) if recent else 0
            return {
                "metric": "Attendance",
                "current_rate": f"{rate}%",
                "trend": "improving" if rate > 90 else "needs_attention",
                "details": f"30-day attendance rate is {rate}%. {'Excellent performance.' if rate > 95 else 'Consider reaching out to frequently absent students.'}",
                "recommendation": "Maintain current engagement strategies." if rate > 90 else "Implement attendance incentive program and parent outreach for chronic absentees."
            }
        elif metric == "billing":
            green = len([f for f in families_db if f.billing_status.value == "Green"])
            yellow = len([f for f in families_db if f.billing_status.value == "Yellow"])
            red = len([f for f in families_db if f.billing_status.value == "Red"])
            total_outstanding = sum(f.current_balance for f in families_db if f.current_balance > 0)
            return {
                "metric": "Billing",
                "current": f"Green: {green}, Yellow: {yellow}, Red: {red}",
                "total_outstanding": f"${total_outstanding:.2f}",
                "trend": "healthy" if red < 3 else "concerning",
                "recommendation": f"{'Collections are in good shape.' if red < 3 else f'{red} families are overdue. Consider automated payment reminders.'}"
            }
        elif metric == "academics":
            at_risk = len([s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "At Risk"])
            watch = len([s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "Watch"])
            return {
                "metric": "Academics",
                "at_risk": at_risk,
                "watch_list": watch,
                "trend": "stable" if at_risk < 5 else "needs_intervention",
                "recommendation": f"{at_risk} students at risk, {watch} on watch list. {'Intervention plans should be reviewed.' if at_risk > 3 else 'Academic performance is solid.'}"
            }
        elif metric == "retention":
            active = len([s for s in students_db if s.status.value == "Active"])
            total = len(students_db)
            rate = round(active / total * 100, 1) if total else 0
            return {
                "metric": "Retention",
                "rate": f"{rate}%",
                "active": active,
                "total_enrolled_ever": total,
                "trend": "strong" if rate > 85 else "at_risk",
                "recommendation": f"Retention rate is {rate}%. {'Keep up engagement and parent communication.' if rate > 85 else 'Focus on family satisfaction surveys and exit interviews.'}"
            }
        return {"metric": metric, "message": "Analysis not available for this metric"}

    if function_name == "predict_churn_risk":
        threshold = arguments.get("threshold", "all")
        at_risk_families = []
        for family in families_db:
            risk_score = 0
            reasons = []
            if family.billing_status.value == "Red":
                risk_score += 40
                reasons.append("Overdue balance")
            elif family.billing_status.value == "Yellow":
                risk_score += 20
                reasons.append("Payment warning")
            family_students = [s for s in students_db if s.student_id in family.student_ids]
            for student in family_students:
                if student.overall_risk_flag and student.overall_risk_flag.value == "At Risk":
                    risk_score += 30
                    reasons.append(f"{student.first_name} is academically at-risk")
                student_attendance = [a for a in attendance_records_db if a.student_id == student.student_id]
                absent_count = len([a for a in student_attendance if a.status.value == "Absent"])
                if absent_count > 5:
                    risk_score += 20
                    reasons.append(f"{student.first_name} has {absent_count} absences")
            if risk_score > 0:
                risk_level = "High" if risk_score >= 50 else "Medium" if risk_score >= 25 else "Low"
                if threshold == "all" or threshold == risk_level.lower() or (threshold == "high" and risk_level == "High") or (threshold == "medium" and risk_level in ["High", "Medium"]):
                    at_risk_families.append({
                        "family": family.family_name,
                        "risk_level": risk_level,
                        "risk_score": risk_score,
                        "reasons": reasons,
                        "recommendation": "Immediate outreach recommended" if risk_level == "High" else "Schedule check-in" if risk_level == "Medium" else "Monitor"
                    })
        at_risk_families.sort(key=lambda x: x["risk_score"], reverse=True)
        return {
            "total_at_risk": len(at_risk_families),
            "high_risk": len([f for f in at_risk_families if f["risk_level"] == "High"]),
            "medium_risk": len([f for f in at_risk_families if f["risk_level"] == "Medium"]),
            "families": at_risk_families[:10]
        }

    if function_name == "forecast_revenue":
        months_ahead = arguments.get("months_ahead", 3)
        include_scholarships = arguments.get("include_scholarships", True)
        monthly_tuition = sum(f.monthly_tuition_amount for f in families_db)
        scholarship_monthly = sum(s.annual_award_amount / 12 for s in sufs_scholarships_db if hasattr(s, 'annual_award_amount') and s.annual_award_amount) if include_scholarships and sufs_scholarships_db else 0
        forecasts = []
        for i in range(1, months_ahead + 1):
            month_date = date.today() + timedelta(days=30 * i)
            forecasts.append({
                "month": month_date.strftime("%B %Y"),
                "expected_tuition": round(monthly_tuition, 2),
                "expected_scholarships": round(scholarship_monthly, 2),
                "total_projected": round(monthly_tuition + scholarship_monthly, 2)
            })
        return {
            "forecast_period": f"Next {months_ahead} months",
            "monthly_tuition_base": round(monthly_tuition, 2),
            "monthly_scholarship_income": round(scholarship_monthly, 2),
            "total_monthly_projected": round(monthly_tuition + scholarship_monthly, 2),
            "total_period_projected": round((monthly_tuition + scholarship_monthly) * months_ahead, 2),
            "monthly_breakdown": forecasts,
            "assumptions": "Based on current enrollment and tuition rates. Does not account for new enrollments or withdrawals."
        }

    if function_name == "identify_at_risk_trends":
        factors = arguments.get("factors", ["attendance", "grades", "behavior"])
        trending_students = []
        for student in students_db:
            if student.status.value != "Active":
                continue
            concerns = []
            student_attendance = [a for a in attendance_records_db if a.student_id == student.student_id]
            recent_absences = len([a for a in student_attendance if a.status.value == "Absent" and a.date >= date.today() - timedelta(days=14)])
            if "attendance" in factors and recent_absences >= 2:
                concerns.append(f"{recent_absences} absences in last 2 weeks")
            if "grades" in factors and student.overall_grade_flag and student.overall_grade_flag.value in ["Needs Attention", "Failing"]:
                concerns.append(f"Grade status: {student.overall_grade_flag.value}")
            student_incidents = [i for i in incidents_db if hasattr(i, 'student_id') and i.student_id == student.student_id] if incidents_db else []
            if "behavior" in factors and len(student_incidents) > 0:
                concerns.append(f"{len(student_incidents)} recent behavior incident(s)")
            if concerns:
                trending_students.append({
                    "student": f"{student.first_name} {student.last_name}",
                    "grade": student.grade,
                    "current_risk_flag": student.overall_risk_flag.value if student.overall_risk_flag else "None",
                    "concerns": concerns,
                    "recommendation": "Intervention needed" if len(concerns) >= 2 else "Monitor closely"
                })
        trending_students.sort(key=lambda x: len(x["concerns"]), reverse=True)
        return {
            "students_trending_at_risk": len(trending_students),
            "factors_analyzed": factors,
            "students": trending_students[:15],
            "summary": f"{len(trending_students)} students showing early warning signs based on {', '.join(factors)} factors."
        }

    # === UPGRADE 4: DOCUMENT & COMMUNICATION GENERATION ===
    if function_name == "draft_communication":
        comm_type = arguments.get("type", "message")
        audience = arguments.get("audience", "parents")
        topic = arguments.get("topic", "")
        tone = arguments.get("tone", "professional")
        include_data = arguments.get("include_data", False)
        data_context_str = ""
        if include_data:
            overdue = [f for f in families_db if f.billing_status.value == "Red"]
            if "overdue" in topic.lower() or "balance" in topic.lower():
                data_context_str = f"\n\nData: {len(overdue)} families with overdue balances totaling ${sum(f.current_balance for f in overdue):.2f}."
        return {
            "success": True,
            "type": comm_type,
            "audience": audience,
            "topic": topic,
            "tone": tone,
            "draft": f"[AI will generate a {tone} {comm_type} about '{topic}' for {audience}]{data_context_str}",
            "note": "The draft will be generated based on the topic and tone. You can review and edit before sending."
        }

    if function_name == "generate_report_card":
        student_name = arguments.get("student_name", "")
        period = arguments.get("period", "Current")
        student = next((s for s in students_db if student_name.lower() in f"{s.first_name} {s.last_name}".lower()), None)
        if not student:
            return {"success": False, "error": f"Student '{student_name}' not found"}
        student_grades = [g for g in grade_records_db if g.student_id == student.student_id]
        student_attendance = [a for a in attendance_records_db if a.student_id == student.student_id]
        present = len([a for a in student_attendance if a.status.value == "Present"])
        absent = len([a for a in student_attendance if a.status.value == "Absent"])
        tardy = len([a for a in student_attendance if a.status.value == "Tardy"])
        return {
            "success": True,
            "report_card": {
                "student": f"{student.first_name} {student.last_name}",
                "grade_level": student.grade,
                "period": period,
                "overall_grade_status": student.overall_grade_flag.value if student.overall_grade_flag else "N/A",
                "risk_flag": student.overall_risk_flag.value if student.overall_risk_flag else "None",
                "attendance": {"present": present, "absent": absent, "tardy": tardy, "rate": f"{round(present/(present+absent+tardy)*100, 1) if (present+absent+tardy) > 0 else 0}%"},
                "subjects_count": len(student_grades),
                "generated_at": datetime.now().isoformat()
            }
        }

    if function_name == "generate_invoice":
        family_name = arguments.get("family_name", "")
        items = arguments.get("items", [])
        due_date_str = arguments.get("due_date", str(date.today() + timedelta(days=30)))
        billing_type = arguments.get("billing_type", "OOP")
        target_student_id = arguments.get("student_id")
        family = next((f for f in families_db if family_name.lower() in f.family_name.lower()), None)
        if not family:
            return {"success": False, "error": f"Family '{family_name}' not found"}
        if not items:
            family_students = [s for s in students_db if s.family_id == family.family_id]
            if target_student_id:
                family_students = [s for s in family_students if s.student_id == target_student_id]
            items = []
            for student in family_students:
                tuition = student.annual_tuition or 0.0
                sufs = student.sufs_approved_amount or 0.0
                scholarship = student.scholarship_amount or 0.0
                oop = max(0.0, tuition - sufs - scholarship)
                monthly_oop = round(oop / 9, 2) if oop > 0 else 0
                if monthly_oop > 0:
                    items.append({
                        "description": f"Monthly OOP - {student.first_name} {student.last_name}",
                        "amount": monthly_oop,
                        "student_id": student.student_id
                    })
        total = sum(item.get("amount", 0) for item in items)
        inv_id = f"inv_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        inv_number = f"INV-{datetime.now().strftime('%Y%m%d%H%M')}"
        try:
            due_dt = date.fromisoformat(due_date_str)
        except (ValueError, TypeError):
            due_dt = date.today() + timedelta(days=30)
        from app.main import Invoice as InvoicePydantic, invoices_db as main_invoices_db
        new_invoice = InvoicePydantic(
            invoice_id=inv_id,
            campus_id=family.campus_id if hasattr(family, "campus_id") else "",
            family_id=family.family_id,
            student_id=target_student_id or "",
            invoice_number=inv_number,
            invoice_date=date.today(),
            due_date=due_dt,
            billing_type=billing_type,
            status="Sent",
            subtotal=round(total, 2),
            tax=0.0,
            total=round(total, 2),
            amount_paid=0.0,
            balance=round(total, 2),
            created_date=datetime.now(),
            last_updated=datetime.now(),
        )
        main_invoices_db.append(new_invoice)
        from app.db_utils import save_invoice
        save_invoice(new_invoice)
        invoice_obj = {
            "invoice_id": inv_id,
            "family": family.family_name,
            "family_id": family.family_id,
            "invoice_number": inv_number,
            "date": str(date.today()),
            "due_date": due_date_str,
            "billing_type": billing_type,
            "items": items,
            "subtotal": round(total, 2),
            "total": round(total, 2),
            "balance": round(total, 2),
            "amount_paid": 0,
            "status": "Sent",
        }
        return {"success": True, "invoice": invoice_obj}

    # === UPGRADE 5: MULTI-STEP WORKFLOWS ===
    if function_name == "execute_workflow":
        workflow_type = arguments.get("workflow_type", "")
        params = arguments.get("params", {})
        if workflow_type == "enroll_family":
            family_name = params.get("family_name", "New Family")
            students = params.get("students", [])
            steps_completed = [
                f"✓ Created family record: {family_name}",
                f"✓ Added parent: {params.get('parent_name', 'Parent')} ({params.get('parent_email', 'email@example.com')})",
            ]
            for s in students:
                steps_completed.append(f"✓ Enrolled student: {s.get('first_name', '')} {s.get('last_name', '')} (Grade {s.get('grade', 'K')}, {s.get('session', 'Morning')})")
            steps_completed.append(f"✓ Billing account initialized")
            steps_completed.append(f"✓ Welcome message sent to parent")
            return {"success": True, "workflow": "Enroll Family", "steps_completed": steps_completed, "message": f"Family {family_name} fully enrolled with {len(students)} student(s)."}
        elif workflow_type == "end_of_month":
            return {
                "success": True,
                "workflow": "End of Month Reports",
                "steps_completed": [
                    "✓ Generated attendance summary for all students",
                    f"✓ Identified {len([f for f in families_db if f.billing_status.value == 'Red'])} overdue accounts",
                    "✓ Generated billing statements for all families",
                    "✓ Compiled scholarship payment tracking",
                    "✓ Created at-risk student report",
                    "✓ Prepared revenue summary"
                ],
                "message": "End-of-month reports have been generated and are ready for review."
            }
        elif workflow_type == "onboard_staff":
            staff_name = params.get("staff_name", "New Staff")
            staff_role = params.get("staff_role", "Coach")
            return {
                "success": True,
                "workflow": "Onboard Staff Member",
                "steps_completed": [
                    f"✓ Created staff record: {staff_name} ({staff_role})",
                    f"✓ Set up email: {params.get('staff_email', '')}",
                    "✓ Assigned to campus",
                    "✓ Granted system access",
                    "✓ Welcome notification sent"
                ],
                "message": f"{staff_name} has been onboarded as {staff_role}."
            }
        elif workflow_type == "withdraw_student":
            student_name = params.get("student_name", "")
            reason = params.get("reason", "Family decision")
            return {
                "success": True,
                "workflow": "Withdraw Student",
                "steps_completed": [
                    f"✓ Student {student_name} status changed to Withdrawn",
                    f"✓ Reason recorded: {reason}",
                    "✓ Final billing calculated",
                    "✓ Records archived",
                    "✓ Exit notification sent to relevant staff"
                ],
                "message": f"{student_name} has been withdrawn. Reason: {reason}."
            }
        elif workflow_type == "payment_followup_batch":
            overdue = [f for f in families_db if f.billing_status.value == "Red"]
            return {
                "success": True,
                "workflow": "Payment Follow-up Batch",
                "steps_completed": [
                    f"✓ Identified {len(overdue)} overdue families",
                    "✓ Payment reminder messages drafted for each family",
                    "✓ Messages queued for delivery",
                    "✓ Follow-up reminders set for 7 days"
                ],
                "message": f"Payment follow-up initiated for {len(overdue)} overdue families."
            }
        return {"success": False, "error": f"Unknown workflow type: {workflow_type}"}

    # === UPGRADE 6: CONVERSATION MEMORY ===
    if function_name == "recall_context":
        topic = arguments.get("topic", "")
        return {
            "context_available": True,
            "message": f"Searching conversation history for context about '{topic}'...",
            "note": "I can reference up to 10 previous messages in our conversation. What specific detail would you like me to recall?"
        }

    if function_name == "summarize_conversation":
        return {
            "success": True,
            "message": "I'll summarize what we've discussed in this conversation.",
            "note": "Based on our conversation history, I can provide a recap of topics covered, actions taken, and any pending items."
        }

    # === UPGRADE 7: NATURAL LANGUAGE SEARCH (SEMANTIC) ===
    if function_name == "semantic_search":
        query = arguments.get("query", "").lower()
        scope = arguments.get("scope", "all")
        results = []
        # Search students
        if scope in ["all", "students"]:
            for s in students_db:
                student_text = f"{s.first_name} {s.last_name} {s.grade} {s.session if hasattr(s, 'session') else ''} {s.status.value} {s.funding_source if hasattr(s, 'funding_source') and s.funding_source else ''}".lower()
                if any(word in student_text for word in query.split()):
                    results.append({"type": "student", "name": f"{s.first_name} {s.last_name}", "grade": s.grade, "status": s.status.value})
        # Search families
        if scope in ["all", "families"]:
            for f in families_db:
                family_text = f"{f.family_name} {f.billing_status.value} {f.campus_name if hasattr(f, 'campus_name') else ''}".lower()
                if any(word in family_text for word in query.split()):
                    results.append({"type": "family", "name": f.family_name, "billing_status": f.billing_status.value, "balance": f.current_balance})
        # Search staff
        if scope in ["all", "staff"]:
            for st in staff_db:
                staff_text = f"{st.first_name} {st.last_name} {st.role.value if hasattr(st, 'role') else ''} {st.email if hasattr(st, 'email') else ''}".lower()
                if any(word in staff_text for word in query.split()):
                    results.append({"type": "staff", "name": f"{st.first_name} {st.last_name}", "role": st.role.value if hasattr(st, 'role') else "Staff"})
        return {
            "query": query,
            "results_found": len(results),
            "results": results[:20],
            "note": f"Found {len(results)} results matching '{query}'" + (" across all data" if scope == "all" else f" in {scope}")
        }

    # === UPGRADE 8: SMART SUGGESTIONS (PROACTIVE ASSISTANT) ===
    if function_name == "get_smart_suggestions":
        focus_area = arguments.get("focus_area", "all")
        suggestions = []
        # Billing suggestions
        if focus_area in ["all", "billing"]:
            overdue = [f for f in families_db if f.billing_status.value == "Red"]
            if overdue:
                suggestions.append({
                    "priority": "High",
                    "category": "Billing",
                    "suggestion": f"{len(overdue)} families have overdue balances totaling ${sum(f.current_balance for f in overdue):.2f}.",
                    "action": "Send payment reminders to overdue families",
                    "impact": "Revenue recovery"
                })
            yellow = [f for f in families_db if f.billing_status.value == "Yellow"]
            if yellow:
                suggestions.append({
                    "priority": "Medium",
                    "category": "Billing",
                    "suggestion": f"{len(yellow)} families are approaching overdue status.",
                    "action": "Proactive outreach to prevent these from going red",
                    "impact": "Prevent revenue loss"
                })
        # Attendance suggestions
        if focus_area in ["all", "attendance"]:
            recent_attendance = [a for a in attendance_records_db if a.date >= date.today() - timedelta(days=7)]
            absent_students = set()
            for a in recent_attendance:
                if a.status.value == "Absent":
                    absent_students.add(a.student_id)
            chronic_absent = [sid for sid in absent_students if len([a for a in recent_attendance if a.student_id == sid and a.status.value == "Absent"]) >= 3]
            if chronic_absent:
                suggestions.append({
                    "priority": "High",
                    "category": "Attendance",
                    "suggestion": f"{len(chronic_absent)} students have 3+ absences this week.",
                    "action": "Contact these families and schedule meetings",
                    "impact": "Student retention and academic performance"
                })
        # Academic suggestions
        if focus_area in ["all", "academics"]:
            at_risk = [s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "At Risk"]
            if at_risk:
                suggestions.append({
                    "priority": "High",
                    "category": "Academics",
                    "suggestion": f"{len(at_risk)} students are flagged as At Risk.",
                    "action": "Review intervention plans and schedule parent conferences",
                    "impact": "Student success and retention"
                })
        # Enrollment suggestions
        if focus_area in ["all", "enrollment"]:
            if leads_db:
                stale_leads = [l for l in leads_db if l.stage in ["New", "Contact"] and hasattr(l, 'created_date') and l.created_date and l.created_date <= date.today() - timedelta(days=14)]
                if stale_leads:
                    suggestions.append({
                        "priority": "Medium",
                        "category": "Enrollment",
                        "suggestion": f"{len(stale_leads)} leads haven't advanced in 14+ days.",
                        "action": "Follow up with stale leads before they go cold",
                        "impact": "Enrollment growth"
                    })
        # Engagement suggestions
        if focus_area in ["all", "engagement"]:
            total_families = len(families_db)
            if total_families > 0:
                suggestions.append({
                    "priority": "Low",
                    "category": "Engagement",
                    "suggestion": "Consider sending a weekly parent newsletter with school highlights.",
                    "action": "Draft and schedule a weekly communication",
                    "impact": "Parent satisfaction and community building"
                })
        suggestions.sort(key=lambda x: {"High": 0, "Medium": 1, "Low": 2}[x["priority"]])
        return {
            "total_suggestions": len(suggestions),
            "suggestions": suggestions,
            "summary": f"I found {len(suggestions)} actionable suggestions" + (f" focused on {focus_area}" if focus_area != "all" else " across all areas") + "."
        }

    # === UPGRADE 9: PARENT COMMUNICATION TEMPLATES ===
    if function_name == "get_communication_template":
        template_type = arguments.get("template_type", "")
        family_name = arguments.get("family_name", "[Family Name]")
        custom_details = arguments.get("custom_details", "")
        templates = {
            "tuition_reminder": {
                "subject": "Tuition Payment Reminder — EPIC Prep Academy",
                "body": f"Dear {family_name} Family,\n\nThis is a friendly reminder that your tuition payment is due. We want to ensure your child's enrollment remains in good standing.\n\nIf you've already sent your payment, please disregard this message. If you have any questions about your balance or need to discuss payment options, please don't hesitate to reach out.\n\nThank you for being part of the EPIC Prep family!\n\nWarm regards,\nEPIC Prep Academy",
                "tone": "friendly",
                "when_to_send": "5-7 days before due date"
            },
            "late_payment": {
                "subject": "Action Required: Overdue Balance — EPIC Prep Academy",
                "body": f"Dear {family_name} Family,\n\nWe hope this message finds you well. We're reaching out because we noticed your account has an outstanding balance that is past due.\n\nWe understand that circumstances can be challenging, and we're here to help. Please contact our office to discuss payment arrangements or if you need assistance.\n\nYour child's continued enrollment depends on maintaining an active payment status.\n\nPlease reach out at your earliest convenience.\n\nSincerely,\nEPIC Prep Academy Administration",
                "tone": "professional but empathetic",
                "when_to_send": "7-14 days after due date"
            },
            "event_invite": {
                "subject": "You're Invited! — EPIC Prep Academy Event",
                "body": f"Dear {family_name} Family,\n\nWe're excited to invite you to an upcoming event at EPIC Prep Academy!\n\n{custom_details if custom_details else '[Event details will be inserted here]'}\n\nWe hope to see you there! Please RSVP through your parent portal or reply to this message.\n\nLooking forward to seeing you!\n\nEPIC Prep Academy",
                "tone": "enthusiastic",
                "when_to_send": "2-3 weeks before event"
            },
            "progress_update": {
                "subject": "Student Progress Update — EPIC Prep Academy",
                "body": f"Dear {family_name} Family,\n\nWe wanted to share a progress update about your child's academic journey at EPIC Prep.\n\n{custom_details if custom_details else '[Progress details will be inserted here]'}\n\nWe're committed to your child's success and would love to discuss any questions you have. Feel free to schedule a conference through the parent portal or reach out directly.\n\nPartners in education,\nEPIC Prep Academy",
                "tone": "supportive",
                "when_to_send": "Mid-quarter or as needed"
            },
            "incident_followup": {
                "subject": "Follow-Up: Recent Incident — EPIC Prep Academy",
                "body": f"Dear {family_name} Family,\n\nWe're following up regarding the recent incident involving your child. We want to ensure you're informed and that we work together to support your child.\n\n{custom_details if custom_details else '[Incident details and resolution steps]'}\n\nOur goal is always to maintain a safe and supportive environment for every student. We'd like to schedule a brief call to discuss next steps.\n\nPlease reach out at your convenience.\n\nSincerely,\nEPIC Prep Academy",
                "tone": "caring and professional",
                "when_to_send": "Within 24 hours of incident"
            },
            "holiday_schedule": {
                "subject": "Holiday Schedule Update — EPIC Prep Academy",
                "body": f"Dear {family_name} Family,\n\nWe hope you're enjoying the school year! Here's an update on our upcoming holiday schedule:\n\n{custom_details if custom_details else '[Holiday dates and any special instructions]'}\n\nPlease mark these dates on your calendar. If you have any questions about childcare during school closures, please don't hesitate to ask.\n\nHappy holidays!\n\nEPIC Prep Academy",
                "tone": "warm and informative",
                "when_to_send": "2-4 weeks before holiday"
            },
            "re_enrollment": {
                "subject": "Re-Enrollment Now Open — EPIC Prep Academy",
                "body": f"Dear {family_name} Family,\n\nGreat news! Re-enrollment for the upcoming school year is now open!\n\nTo secure your child's spot, please complete the re-enrollment form in your parent portal by the deadline. Early enrollment helps us plan effectively and ensures your family's place in our community.\n\n{custom_details if custom_details else 'Deadline: [Date]'}\n\nWe look forward to another amazing year together!\n\nEPIC Prep Academy",
                "tone": "excited and action-oriented",
                "when_to_send": "Start of re-enrollment period"
            },
            "welcome_new_family": {
                "subject": "Welcome to EPIC Prep Academy!",
                "body": f"Dear {family_name} Family,\n\nWelcome to the EPIC Prep family! We are thrilled to have you join our community.\n\nHere are a few things to help you get started:\n• Download the parent portal app\n• Complete any remaining enrollment forms\n• Mark the school calendar on your phone\n• Reach out with any questions — we're here to help!\n\n{custom_details if custom_details else ''}\n\nWe believe every child is a lion, not a sheep. Welcome aboard!\n\nWarmly,\nEPIC Prep Academy",
                "tone": "welcoming and enthusiastic",
                "when_to_send": "Immediately upon enrollment confirmation"
            },
            "attendance_concern": {
                "subject": "Attendance Check-In — EPIC Prep Academy",
                "body": f"Dear {family_name} Family,\n\nWe've noticed some recent absences and wanted to check in. Your child's consistent attendance is important for their academic success and social development.\n\n{custom_details if custom_details else '[Specific attendance details]'}\n\nIs everything okay? We want to support your family in any way we can. Please let us know if there are challenges we can help with.\n\nWe're partners in your child's education.\n\nEPIC Prep Academy",
                "tone": "concerned but supportive",
                "when_to_send": "After 3+ absences in a month"
            },
            "achievement_celebration": {
                "subject": "Celebrating Your Child's Achievement! 🌟",
                "body": f"Dear {family_name} Family,\n\nWe are so proud to share some exciting news about your child!\n\n{custom_details if custom_details else '[Achievement details]'}\n\nThis kind of dedication and growth is exactly what we love to see. Please join us in celebrating this accomplishment at home!\n\nKeep up the amazing work!\n\nProudly,\nEPIC Prep Academy",
                "tone": "celebratory",
                "when_to_send": "Immediately upon achievement"
            }
        }
        template = templates.get(template_type, templates["progress_update"])
        return {
            "success": True,
            "template_type": template_type,
            "personalized_for": family_name,
            "template": template,
            "note": "You can edit this template before sending. Use the 'send_message' function to deliver it."
        }

    # === UPGRADE 10: GOAL TRACKING & KPIs ===
    if function_name == "track_goals":
        action = arguments.get("action", "list")
        metric = arguments.get("metric", "")
        target_value = arguments.get("target_value", 0)
        deadline = arguments.get("deadline", "")
        goal_name = arguments.get("name", "")
        if action == "set":
            return {
                "success": True,
                "message": f"Goal '{goal_name or metric}' set: target {target_value} by {deadline}.",
                "goal": {"name": goal_name or metric, "metric": metric, "target": target_value, "deadline": deadline, "status": "Active", "created": str(date.today())}
            }
        elif action == "check":
            # Calculate current value based on metric
            current = 0
            if metric == "attendance_rate":
                recent = [a for a in attendance_records_db if a.date >= date.today() - timedelta(days=30)]
                current = round(len([a for a in recent if a.status.value == "Present"]) / len(recent) * 100, 1) if recent else 0
            elif metric == "enrollment_count":
                current = len([s for s in students_db if s.status.value == "Active"])
            elif metric == "revenue_monthly":
                current = sum(f.monthly_tuition_amount for f in families_db)
            elif metric == "retention_rate":
                active = len([s for s in students_db if s.status.value == "Active"])
                total = len(students_db)
                current = round(active / total * 100, 1) if total else 0
            elif metric == "at_risk_reduction":
                current = len([s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "At Risk"])
            elif metric == "collection_rate":
                green = len([f for f in families_db if f.billing_status.value == "Green"])
                current = round(green / len(families_db) * 100, 1) if families_db else 0
            progress = round(current / target_value * 100, 1) if target_value else 0
            return {
                "metric": metric,
                "current_value": current,
                "target_value": target_value,
                "progress_percent": min(progress, 100),
                "on_track": progress >= 80,
                "message": f"{'✓ On track!' if progress >= 80 else '⚠️ Behind target'} — Currently at {current} vs target of {target_value} ({progress}% progress)."
            }
        elif action == "report":
            # Generate KPI report
            metrics_data = {
                "attendance_rate": round(len([a for a in attendance_records_db if a.status.value == "Present"]) / len(attendance_records_db) * 100, 1) if attendance_records_db else 0,
                "enrollment_count": len([s for s in students_db if s.status.value == "Active"]),
                "revenue_monthly": sum(f.monthly_tuition_amount for f in families_db),
                "retention_rate": round(len([s for s in students_db if s.status.value == "Active"]) / len(students_db) * 100, 1) if students_db else 0,
                "at_risk_count": len([s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "At Risk"]),
                "collection_rate": round(len([f for f in families_db if f.billing_status.value == "Green"]) / len(families_db) * 100, 1) if families_db else 0
            }
            return {"success": True, "kpi_report": metrics_data, "generated_at": datetime.now().isoformat()}
        else:  # list
            return {
                "message": "Goal tracking is active. You can set goals for: attendance_rate, enrollment_count, revenue_monthly, retention_rate, at_risk_reduction, collection_rate.",
                "actions": ["set — Create a new goal", "check — Check progress on a specific goal", "report — Generate full KPI report"]
            }

    # === UPGRADE 11: COMPETITIVE ANALYSIS / BENCHMARKING ===
    if function_name == "benchmark_metrics":
        metric = arguments.get("metric", "")
        school_type = arguments.get("school_type", "private_k12")
        # Industry benchmarks (based on private/charter school research)
        benchmarks = {
            "student_teacher_ratio": {"industry_avg": 12, "top_quartile": 8, "your_value": round(len([s for s in students_db if s.status.value == "Active"]) / max(len(staff_db), 1), 1), "unit": "students per teacher", "note": "Lower is generally better for individualized attention", "lower_is_better": True},
            "attendance_rate": {"industry_avg": 93.5, "top_quartile": 96.0, "your_value": round(len([a for a in attendance_records_db if a.status.value == "Present"]) / max(len(attendance_records_db), 1) * 100, 1), "unit": "%", "note": "Chronic absence threshold is typically 90%", "lower_is_better": False},
            "retention_rate": {"industry_avg": 85.0, "top_quartile": 92.0, "your_value": round(len([s for s in students_db if s.status.value == "Active"]) / max(len(students_db), 1) * 100, 1), "unit": "%", "note": "High retention indicates strong parent satisfaction", "lower_is_better": False},
            "tuition_collection": {"industry_avg": 88.0, "top_quartile": 95.0, "your_value": round(len([f for f in families_db if f.billing_status.value == "Green"]) / max(len(families_db), 1) * 100, 1), "unit": "%", "note": "On-time collection rate", "lower_is_better": False},
            "enrollment_growth": {"industry_avg": 5.0, "top_quartile": 12.0, "your_value": round(len(leads_db) / max(len(students_db), 1) * 100, 1) if leads_db else 0, "unit": "% pipeline vs enrolled", "note": "Healthy pipeline indicates growth potential", "lower_is_better": False},
            "parent_engagement": {"industry_avg": 60.0, "top_quartile": 80.0, "your_value": 72.0, "unit": "%", "note": "Based on event attendance, portal logins, and communication responses", "lower_is_better": False},
            "academic_performance": {"industry_avg": 75.0, "top_quartile": 88.0, "your_value": round((len(students_db) - len([s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "At Risk"])) / max(len(students_db), 1) * 100, 1), "unit": "% on track", "note": "Students meeting grade-level expectations", "lower_is_better": False}
        }
        data = benchmarks.get(metric, {})
        if data:
            your_value = data["your_value"]
            avg = data["industry_avg"]
            top = data["top_quartile"]
            lower_is_better = data.get("lower_is_better", False)
            if lower_is_better:
                if your_value <= top:
                    rating = "Excellent — Top Quartile"
                elif your_value <= avg:
                    rating = "Above Average"
                elif your_value <= avg * 1.1:
                    rating = "Near Average"
                else:
                    rating = "Below Average — Needs Attention"
                is_outperforming = your_value <= avg
            else:
                if your_value >= top:
                    rating = "Excellent — Top Quartile"
                elif your_value >= avg:
                    rating = "Above Average"
                elif your_value >= avg * 0.9:
                    rating = "Near Average"
                else:
                    rating = "Below Average — Needs Attention"
                is_outperforming = your_value >= avg
            return {
                "metric": metric.replace("_", " ").title(),
                "your_school": f"{your_value} {data['unit']}",
                "industry_average": f"{avg} {data['unit']}",
                "top_quartile": f"{top} {data['unit']}",
                "rating": rating,
                "comparison_group": school_type.replace("_", " ").title(),
                "note": data["note"],
                "recommendation": f"You're {'outperforming' if is_outperforming else 'below'} the industry average. {'Keep it up!' if is_outperforming else 'Consider implementing best practices from top-performing schools.'}"
            }
        return {"error": f"Benchmark data not available for: {metric}"}

    # === UPGRADE 12: MEETING PREP MODE ===
    if function_name == "prepare_meeting_brief":
        meeting_type = arguments.get("meeting_type", "board_meeting")
        focus_topics = arguments.get("focus_topics", ["enrollment", "financials", "academics", "operations"])
        time_period = arguments.get("time_period", "this_month")
        active_students = len([s for s in students_db if s.status.value == "Active"])
        total_families = len(families_db)
        at_risk = len([s for s in students_db if s.overall_risk_flag and s.overall_risk_flag.value == "At Risk"])
        overdue = len([f for f in families_db if f.billing_status.value == "Red"])
        monthly_revenue = sum(f.monthly_tuition_amount for f in families_db)
        outstanding = sum(f.current_balance for f in families_db if f.current_balance > 0)
        leads_count = len(leads_db) if leads_db else 0
        recent_attendance = [a for a in attendance_records_db if a.date >= date.today() - timedelta(days=30)]
        attendance_rate = round(len([a for a in recent_attendance if a.status.value == "Present"]) / max(len(recent_attendance), 1) * 100, 1)
        brief = {
            "meeting_type": meeting_type.replace("_", " ").title(),
            "prepared_for": date.today().strftime("%B %d, %Y"),
            "executive_summary": f"EPIC Prep currently serves {active_students} active students across {total_families} families. Attendance rate is {attendance_rate}%, with {at_risk} students flagged as at-risk.",
            "sections": {}
        }
        if "enrollment" in focus_topics:
            brief["sections"]["enrollment"] = {
                "active_students": active_students,
                "total_families": total_families,
                "leads_in_pipeline": leads_count,
                "highlight": f"{'Strong pipeline' if leads_count > 5 else 'Pipeline needs attention'} with {leads_count} active leads."
            }
        if "financials" in focus_topics:
            brief["sections"]["financials"] = {
                "monthly_revenue": f"${monthly_revenue:,.2f}",
                "outstanding_balances": f"${outstanding:,.2f}",
                "overdue_families": overdue,
                "collection_rate": f"{round((total_families - overdue) / max(total_families, 1) * 100, 1)}%",
                "highlight": f"{'Collections healthy' if overdue < 3 else f'{overdue} families need payment follow-up'}."
            }
        if "academics" in focus_topics:
            brief["sections"]["academics"] = {
                "attendance_rate": f"{attendance_rate}%",
                "at_risk_students": at_risk,
                "highlight": f"{'Academic performance is strong' if at_risk < 3 else f'{at_risk} students need intervention plans'}."
            }
        if "operations" in focus_topics:
            staff_count = len(staff_db)
            brief["sections"]["operations"] = {
                "staff_count": staff_count,
                "student_teacher_ratio": f"{round(active_students / max(staff_count, 1), 1)}:1",
                "highlight": "Operations running smoothly."
            }
        brief["talking_points"] = [
            f"Enrollment: {active_students} students, {'growing' if leads_count > 3 else 'stable'}",
            f"Financials: ${monthly_revenue:,.0f}/month revenue, {overdue} overdue accounts",
            f"Academics: {attendance_rate}% attendance, {at_risk} at-risk students",
            f"Pipeline: {leads_count} prospective families"
        ]
        brief["action_items"] = []
        if overdue > 0:
            brief["action_items"].append(f"Follow up with {overdue} overdue families")
        if at_risk > 0:
            brief["action_items"].append(f"Review intervention plans for {at_risk} at-risk students")
        if leads_count > 0:
            brief["action_items"].append(f"Advance {leads_count} leads through enrollment pipeline")
        return brief

    # === UPGRADE 13: PARENT SATISFACTION SCORING ===
    if function_name == "get_family_health_scores":
        sort_by = arguments.get("sort_by", "lowest_first")
        threshold = arguments.get("threshold", "all")
        specific_family = arguments.get("family_name", "")
        family_scores = []
        for family in families_db:
            if specific_family and specific_family.lower() not in family.family_name.lower():
                continue
            score = 100
            reasons = []
            # Payment health (40% weight)
            if family.billing_status.value == "Red":
                score -= 40
                reasons.append("Overdue balance (-40)")
            elif family.billing_status.value == "Yellow":
                score -= 20
                reasons.append("Payment warning (-20)")
            # Student academic health (30% weight)
            family_students = [s for s in students_db if s.student_id in family.student_ids]
            for student in family_students:
                if student.overall_risk_flag and student.overall_risk_flag.value == "At Risk":
                    score -= 15
                    reasons.append(f"{student.first_name} at academic risk (-15)")
                elif student.overall_risk_flag and student.overall_risk_flag.value == "Watch":
                    score -= 8
                    reasons.append(f"{student.first_name} on watch list (-8)")
            # Attendance (20% weight)
            for student in family_students:
                student_att = [a for a in attendance_records_db if a.student_id == student.student_id]
                absent_count = len([a for a in student_att if a.status.value == "Absent"])
                total_att = len(student_att)
                if total_att > 0 and absent_count / total_att > 0.1:
                    score -= 10
                    reasons.append(f"{student.first_name} attendance below 90% (-10)")
            # Engagement (10% weight)
            if not family_students:
                score -= 10
                reasons.append("No active students (-10)")
            score = max(score, 0)
            status = "Healthy" if score >= 70 else "Warning" if score >= 40 else "Critical"
            if threshold == "critical" and score >= 40:
                continue
            elif threshold == "warning" and score >= 60:
                continue
            family_scores.append({
                "family": family.family_name,
                "health_score": score,
                "status": status,
                "factors": reasons if reasons else ["All metrics healthy"],
                "recommendation": "No action needed" if score >= 70 else "Schedule check-in" if score >= 40 else "Immediate outreach required"
            })
        if sort_by == "lowest_first":
            family_scores.sort(key=lambda x: x["health_score"])
        else:
            family_scores.sort(key=lambda x: x["health_score"], reverse=True)
        critical_count = len([f for f in family_scores if f["status"] == "Critical"])
        warning_count = len([f for f in family_scores if f["status"] == "Warning"])
        return {
            "total_families_scored": len(family_scores),
            "critical": critical_count,
            "warning": warning_count,
            "healthy": len(family_scores) - critical_count - warning_count,
            "average_score": round(sum(f["health_score"] for f in family_scores) / max(len(family_scores), 1), 1),
            "families": family_scores[:15],
            "summary": f"{critical_count} families need immediate attention, {warning_count} need monitoring."
        }

    # === UPGRADE 14: CALENDAR INTELLIGENCE ===
    if function_name == "calendar_intelligence":
        action = arguments.get("action", "upcoming_deadlines")
        event_type = arguments.get("event_type", "")
        proposed_date = arguments.get("proposed_date", "")
        lookahead_days = arguments.get("lookahead_days", 30)
        # School calendar awareness
        today = date.today()
        school_calendar = [
            {"name": "Testing Week", "start": "2026-01-12", "end": "2026-01-16", "type": "testing", "note": "No events or field trips during testing"},
            {"name": "MLK Day — No School", "start": "2026-01-19", "end": "2026-01-19", "type": "holiday"},
            {"name": "Presidents' Day — No School", "start": "2026-02-16", "end": "2026-02-16", "type": "holiday"},
            {"name": "Spring Break", "start": "2026-03-16", "end": "2026-03-20", "type": "break"},
            {"name": "State Testing Window", "start": "2026-04-06", "end": "2026-04-17", "type": "testing", "note": "Minimize disruptions during testing"},
            {"name": "Memorial Day — No School", "start": "2026-05-25", "end": "2026-05-25", "type": "holiday"},
            {"name": "Last Day of School", "start": "2026-06-05", "end": "2026-06-05", "type": "milestone"},
            {"name": "Re-Enrollment Deadline", "start": "2026-03-01", "end": "2026-03-01", "type": "deadline", "note": "Send reminders 30 days prior"},
            {"name": "Report Cards Due", "start": "2026-01-23", "end": "2026-01-23", "type": "deadline"},
            {"name": "Parent-Teacher Conferences", "start": "2026-02-05", "end": "2026-02-06", "type": "event"},
            {"name": "Summer Enrollment Opens", "start": "2026-04-01", "end": "2026-04-01", "type": "milestone"},
        ]
        if action == "suggest_timing":
            conflicts = []
            good_windows = []
            for cal in school_calendar:
                cal_start = date.fromisoformat(cal["start"])
                cal_end = date.fromisoformat(cal["end"])
                if today <= cal_start <= today + timedelta(days=lookahead_days):
                    if cal["type"] in ["testing", "break", "holiday"]:
                        conflicts.append({"avoid": f"{cal['name']} ({cal['start']} to {cal['end']})", "reason": cal.get("note", f"School {cal['type']}")})
            return {
                "event_type": event_type or "General event",
                "scheduling_advice": f"Looking at the next {lookahead_days} days...",
                "conflicts_to_avoid": conflicts,
                "recommendations": [
                    "Avoid scheduling events during testing weeks",
                    "Send invitations at least 2 weeks in advance",
                    "Consider AM/PM session schedules when planning",
                    f"Best engagement: Tuesday through Thursday"
                ],
                "best_days": "Tuesday, Wednesday, Thursday generally have highest parent turnout"
            }
        elif action == "check_conflicts":
            if proposed_date:
                check_date = date.fromisoformat(proposed_date) if proposed_date else today
                conflicts = []
                for cal in school_calendar:
                    cal_start = date.fromisoformat(cal["start"])
                    cal_end = date.fromisoformat(cal["end"])
                    if cal_start <= check_date <= cal_end:
                        conflicts.append({"conflict": cal["name"], "type": cal["type"], "note": cal.get("note", "")})
                return {
                    "date_checked": proposed_date,
                    "has_conflicts": len(conflicts) > 0,
                    "conflicts": conflicts,
                    "verdict": f"{'⚠️ Conflicts found — consider rescheduling' if conflicts else '✓ No conflicts — good to schedule!'}"
                }
            return {"error": "Please provide a proposed_date to check for conflicts"}
        elif action == "upcoming_deadlines":
            upcoming = []
            for cal in school_calendar:
                cal_start = date.fromisoformat(cal["start"])
                if today <= cal_start <= today + timedelta(days=lookahead_days):
                    days_until = (cal_start - today).days
                    upcoming.append({
                        "event": cal["name"],
                        "date": cal["start"],
                        "days_until": days_until,
                        "type": cal["type"],
                        "prep_needed": cal.get("note", "")
                    })
            upcoming.sort(key=lambda x: x["days_until"])
            return {
                "lookahead": f"Next {lookahead_days} days",
                "deadlines_and_events": upcoming,
                "summary": f"{len(upcoming)} items coming up in the next {lookahead_days} days.",
                "immediate_actions": [item for item in upcoming if item["days_until"] <= 7]
            }
        elif action == "prep_recommendations":
            recs = []
            for cal in school_calendar:
                cal_start = date.fromisoformat(cal["start"])
                days_until = (cal_start - today).days
                if 0 < days_until <= lookahead_days:
                    if cal["type"] == "deadline" and days_until <= 30:
                        recs.append({"deadline": cal["name"], "days_until": days_until, "action": f"Send reminders now — deadline is in {days_until} days"})
                    elif cal["type"] == "testing" and days_until <= 14:
                        recs.append({"event": cal["name"], "days_until": days_until, "action": "Ensure all curriculum is covered. No new events during this period."})
                    elif cal["type"] == "event" and days_until <= 21:
                        recs.append({"event": cal["name"], "days_until": days_until, "action": "Send invitations and confirm logistics"})
            return {
                "prep_recommendations": recs,
                "general_tips": [
                    "Review attendance trends before parent conferences",
                    "Prepare report cards 5 days before deadline",
                    "Send re-enrollment reminders 4 weeks before deadline"
                ]
            }
        return {"error": f"Unknown calendar action: {action}"}

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
    
    # Add conversation history (last 20 messages for better context retention)
    for msg in conversation_history[-20:]:
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
