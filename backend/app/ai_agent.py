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

Remember: You're helping run a school. Be helpful, accurate, and supportive of the school's mission: "Raising Lions not Sheep"
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
    }
]


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
    
    # Build messages array
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
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
            tools=AVAILABLE_FUNCTIONS,
            tool_choice="auto",
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
                
                # Execute the function
                result = execute_function(function_name, arguments, data_context)
                
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
