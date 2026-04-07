from fastapi import FastAPI, HTTPException, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date, timedelta
import random
import os
import uuid
from enum import Enum
import csv
import io

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Import AI agent
from .ai_agent import chat_with_auvora

# Import Clerk user management router
from .clerk_users import router as clerk_users_router

# Import database components
from .database import engine, get_db, init_db, SessionLocal
from . import models, crud
from . import db_utils
from sqlalchemy.orm import Session as DBSession

app = FastAPI()

@app.on_event("startup")
def startup_db():
    """Initialize database on startup and seed with demo data if empty"""
    init_db()
    print("Database initialized successfully")
    # Check if database is empty and seed if needed
    db = SessionLocal()
    try:
        if db.query(models.Organization).count() == 0:
            print("Database is empty, seeding with demo data...")
            db.close()
            db_utils.seed_from_demo_data()
        else:
            print("Database has existing data, skipping seed")
            db.close()
    except Exception as e:
        db.close()
        print(f"Error checking database: {e}")
        # Fallback: try to seed anyway
        try:
            db_utils.seed_from_demo_data()
        except Exception:
            pass

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include Clerk user management router
app.include_router(clerk_users_router)

class Session(str, Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"

class Room(str, Enum):
    ROOM_1 = "Room 1"
    ROOM_2 = "Room 2"
    ROOM_3 = "Room 3"
    ROOM_4 = "Room 4"

class StudentStatus(str, Enum):
    ACTIVE = "Active"
    WAITLISTED = "Waitlisted"
    WITHDRAWN = "Withdrawn"

class BillingStatus(str, Enum):
    GREEN = "Green"
    YELLOW = "Yellow"
    RED = "Red"

class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    TARDY = "Tardy"

class GradeFlag(str, Enum):
    ON_TRACK = "On track"
    NEEDS_ATTENTION = "Needs attention"
    FAILING = "Failing"

class IXLStatus(str, Enum):
    ON_TRACK = "On track"
    NEEDS_ATTENTION = "Needs attention"

class AcellusStatus(str, Enum):
    ON_TRACK = "On track"
    BEHIND = "Behind"
    AT_RISK = "At risk"

class RiskFlag(str, Enum):
    NONE = "None"
    WATCH = "Watch"
    AT_RISK = "At risk"

class StaffRole(str, Enum):
    OWNER = "Owner"
    DIRECTOR = "Director"
    COACH = "Coach"

class BehaviorType(str, Enum):
    POSITIVE = "Positive"
    CONCERN = "Concern"

class ConferenceStatus(str, Enum):
    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class MessageSenderType(str, Enum):
    PARENT = "Parent"
    STAFF = "Staff"

class EventType(str, Enum):
    FIELD_TRIP = "Field Trip"
    SCHOOL_EVENT = "School Event"
    FUNDRAISER = "Fundraiser"
    PERFORMANCE = "Performance"
    PARENT_NIGHT = "Parent Night"
    OTHER = "Other"

class RSVPStatus(str, Enum):
    PENDING = "Pending"
    ATTENDING = "Attending"
    NOT_ATTENDING = "Not Attending"

class DocumentType(str, Enum):
    PERMISSION_SLIP = "Permission Slip"
    ENROLLMENT_CONTRACT = "Enrollment Contract"
    EMERGENCY_CONTACT = "Emergency Contact"
    MEDICAL_FORM = "Medical Form"
    POLICY_ACKNOWLEDGMENT = "Policy Acknowledgment"
    OTHER = "Other"

class DocumentStatus(str, Enum):
    PENDING = "Pending"
    SIGNED = "Signed"
    EXPIRED = "Expired"

class ProductCategory(str, Enum):
    APPAREL = "Apparel"
    SUPPLIES = "Supplies"
    EVENT_FEE = "Event Fee"
    OTHER = "Other"

class OrderStatus(str, Enum):
    PENDING = "Pending"
    PAID = "Paid"
    CANCELLED = "Cancelled"

class PhotoAlbumStatus(str, Enum):
    DRAFT = "Draft"
    PUBLISHED = "Published"

class IncidentSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class IncidentType(str, Enum):
    BEHAVIORAL = "Behavioral"
    MEDICAL = "Medical"
    SAFETY = "Safety"
    ACADEMIC = "Academic"
    OTHER = "Other"

class FundingSource(str, Enum):
    STEP_UP = "Step-Up"
    OUT_OF_POCKET = "Out-of-Pocket"
    MIXED = "Mixed"
    EPIC_SCHOLARSHIP = "EPIC Scholarship"

class PaymentSource(str, Enum):
    STEP_UP = "Step-Up"
    OUT_OF_POCKET = "Out-of-Pocket"

class BillingCategory(str, Enum):
    TUITION = "Tuition"
    FEE = "Fee"
    STORE = "Store"
    OTHER = "Other"

class UserRole(str, Enum):
    SUPER_ADMIN = "Super Admin"
    CAMPUS_ADMIN = "Campus Admin"
    TEACHER = "Teacher"
    PARENT = "Parent"

class AuditAction(str, Enum):
    CREATE = "Create"
    UPDATE = "Update"
    DELETE = "Delete"
    LOGIN = "Login"
    LOGOUT = "Logout"

class Organization(BaseModel):
    organization_id: str
    name: str
    created_date: date

class Campus(BaseModel):
    campus_id: str
    organization_id: str
    name: str
    location: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    active: bool = True

class User(BaseModel):
    user_id: str
    email: str
    password_hash: str  # In production, use proper password hashing
    first_name: str
    last_name: str
    role: UserRole
    campus_ids: List[str]  # Campuses this user has access to
    active: bool = True
    created_date: date
    last_login: Optional[datetime] = None

class AuditLog(BaseModel):
    audit_id: str
    user_id: Optional[str]
    campus_id: Optional[str]
    entity_type: str  # "Student", "Family", etc.
    entity_id: str
    action: AuditAction
    before_data: Optional[dict] = None
    after_data: Optional[dict] = None
    timestamp: datetime
    ip_address: Optional[str] = None

class Student(BaseModel):
    student_id: str
    campus_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    grade: str
    session: Session
    room: Room
    status: StudentStatus
    family_id: str
    enrollment_start_date: date
    enrollment_end_date: Optional[date]
    attendance_present_count: int
    attendance_absent_count: int
    attendance_tardy_count: int
    overall_grade_flag: GradeFlag
    ixl_status_flag: IXLStatus
    overall_risk_flag: RiskFlag
    funding_source: FundingSource = FundingSource.OUT_OF_POCKET
    step_up_percentage: int = 0

class Family(BaseModel):
    family_id: str
    family_name: str
    primary_parent_id: str
    parent_ids: List[str]
    student_ids: List[str]
    monthly_tuition_amount: float
    current_balance: float
    billing_status: BillingStatus
    last_payment_date: Optional[date]
    last_payment_amount: Optional[float]

class Parent(BaseModel):
    parent_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    relationship: str
    primary_guardian: bool
    preferred_contact_method: str
    student_ids: List[str]

class Staff(BaseModel):
    staff_id: str
    campus_ids: List[str]
    first_name: str
    last_name: str
    role: StaffRole
    email: str
    assigned_rooms: List[str]
    permissions: str

class GradeRecord(BaseModel):
    grade_record_id: str
    campus_id: str
    student_id: str
    subject: str
    term: str
    grade_value: str
    is_failing: bool

class BehaviorNote(BaseModel):
    behavior_note_id: str
    campus_id: str
    student_id: str
    date: date
    type: BehaviorType
    summary: str
    flag_for_followup: bool

class AttendanceRecord(BaseModel):
    attendance_id: str
    campus_id: str
    student_id: str
    date: date
    status: AttendanceStatus
    session: Session

class IXLSummary(BaseModel):
    ixl_summary_id: str
    student_id: str
    week_start_date: date
    weekly_hours: float
    skills_practiced_this_week: int
    skills_mastered_total: int
    math_proficiency: IXLStatus
    ela_proficiency: IXLStatus
    last_active_date: date
    recent_skills: List[str]

class AcellusCourse(BaseModel):
    course_id: str
    student_id: str
    course_name: str
    subject: str
    total_steps: int
    completed_steps: int
    completion_percentage: float
    current_grade: str
    grade_percentage: float
    status: AcellusStatus
    last_activity_date: date
    time_spent_hours: float

class AcellusSummary(BaseModel):
    acellus_summary_id: str
    student_id: str
    total_courses: int
    courses_on_track: int
    courses_behind: int
    overall_gpa: float
    total_time_spent_hours: float
    last_active_date: date
    overall_status: AcellusStatus

class BillingRecord(BaseModel):
    billing_record_id: str
    campus_id: str
    family_id: str
    date: date
    type: str
    description: str
    amount: float
    source: Optional[PaymentSource] = None
    period_month: Optional[str] = None
    category: Optional[BillingCategory] = None
    student_id: Optional[str] = None

class Conference(BaseModel):
    conference_id: str
    student_id: str
    parent_id: str
    staff_id: str
    date_time: datetime
    location: str
    status: ConferenceStatus
    notes: Optional[str]

class Message(BaseModel):
    message_id: str
    sender_type: MessageSenderType
    sender_id: str
    recipient_type: MessageSenderType
    recipient_id: str
    student_id: Optional[str]
    date_time: datetime
    content_preview: str

class Event(BaseModel):
    event_id: str
    campus_id: str
    title: str
    description: str
    event_type: EventType
    date: date
    time: str
    location: str
    requires_rsvp: bool
    requires_permission_slip: bool
    requires_payment: bool
    payment_amount: Optional[float]
    created_by_staff_id: str

class EventRSVP(BaseModel):
    rsvp_id: str
    event_id: str
    family_id: str
    parent_id: str
    student_ids: List[str]
    status: RSVPStatus
    response_date: Optional[datetime]

class Document(BaseModel):
    document_id: str
    campus_id: str
    title: str
    document_type: DocumentType
    description: str
    required_for: str
    status: DocumentStatus
    created_date: date
    expiration_date: Optional[date]
    file_url: Optional[str]

class DocumentSignature(BaseModel):
    signature_id: str
    document_id: str
    parent_id: str
    student_id: Optional[str]
    signed_date: datetime
    signature_data: str  # Base64 encoded signature or "Electronic Signature"

class Product(BaseModel):
    product_id: str
    name: str
    description: str
    category: ProductCategory
    price: float
    image_url: Optional[str]
    available: bool

class Order(BaseModel):
    order_id: str
    family_id: str
    parent_id: str
    items: List[dict]  # [{product_id, quantity, price}]
    total_amount: float
    status: OrderStatus
    order_date: datetime
    payment_date: Optional[datetime]

class PhotoAlbum(BaseModel):
    album_id: str
    campus_id: str
    title: str
    description: str
    created_by_staff_id: str
    created_date: date
    status: PhotoAlbumStatus
    photo_urls: List[str]
    visible_to_grades: List[str]

class Incident(BaseModel):
    incident_id: str
    campus_id: str
    student_id: str
    reported_by_staff_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    date: date
    time: str
    description: str
    action_taken: str
    parent_notified: bool
    followup_required: bool

class HealthRecord(BaseModel):
    health_record_id: str
    campus_id: str
    student_id: str
    allergies: List[str]
    medications: List[str]
    medical_conditions: List[str]
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relationship: str
    physician_name: Optional[str]
    physician_phone: Optional[str]
    last_updated: date

class InvoiceStatus(str, Enum):
    DRAFT = "Draft"
    SENT = "Sent"
    PAID = "Paid"
    OVERDUE = "Overdue"
    CANCELLED = "Cancelled"

class PaymentPlanStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    DEFAULTED = "Defaulted"
    CANCELLED = "Cancelled"

class Invoice(BaseModel):
    invoice_id: str
    campus_id: str
    family_id: str
    invoice_number: str
    invoice_date: date
    due_date: date
    status: InvoiceStatus
    subtotal: float
    tax: float
    total: float
    amount_paid: float
    balance: float
    notes: Optional[str] = None
    created_date: datetime
    last_updated: datetime

class InvoiceLineItem(BaseModel):
    line_item_id: str
    invoice_id: str
    description: str
    category: BillingCategory
    student_id: Optional[str] = None
    quantity: int
    unit_price: float
    total: float
    funding_source: Optional[PaymentSource] = None

class PaymentPlan(BaseModel):
    payment_plan_id: str
    campus_id: str
    family_id: str
    plan_name: str
    total_amount: float
    amount_paid: float
    balance: float
    start_date: date
    end_date: date
    status: PaymentPlanStatus
    created_date: datetime
    last_updated: datetime

class PaymentSchedule(BaseModel):
    schedule_id: str
    payment_plan_id: str
    installment_number: int
    due_date: date
    amount: float
    paid: bool
    paid_date: Optional[date] = None
    paid_amount: float

class LeadStage(str, Enum):
    NEW_INQUIRY = "New Inquiry"
    CONTACTED = "Contacted"
    TOUR_SCHEDULED = "Tour Scheduled"
    TOURED = "Toured"
    APPLICATION_SUBMITTED = "Application Submitted"
    ACCEPTED = "Accepted"
    ENROLLED = "Enrolled"
    LOST = "Lost"

class LeadSource(str, Enum):
    WEBSITE = "Website"
    REFERRAL = "Referral"
    SOCIAL_MEDIA = "Social Media"
    WALK_IN = "Walk-in"
    EVENT = "Event"
    OTHER = "Other"

class Lead(BaseModel):
    lead_id: str
    campus_id: str
    parent_first_name: str
    parent_last_name: str
    email: str
    phone: str
    child_first_name: str
    child_last_name: str
    child_dob: date
    desired_grade: str
    desired_start_date: date
    stage: LeadStage
    source: LeadSource
    created_date: date
    last_contact_date: Optional[date] = None
    tour_date: Optional[date] = None
    notes: str
    assigned_to: Optional[str] = None  # staff_id

class CampusCapacity(BaseModel):
    campus_id: str
    grade: str
    session: Session
    total_capacity: int
    current_enrollment: int
    waitlist_count: int

class CommunicationType(str, Enum):
    EMAIL = "Email"
    SMS = "SMS"
    APP_NOTIFICATION = "App Notification"
    ALL = "All"

class TriggerType(str, Enum):
    ATTENDANCE_ALERT = "Attendance Alert"
    GRADE_ALERT = "Grade Alert"
    BALANCE_ALERT = "Balance Alert"
    BEHAVIOR_ALERT = "Behavior Alert"
    IXL_ALERT = "IXL Alert"

class BroadcastStatus(str, Enum):
    DRAFT = "Draft"
    SCHEDULED = "Scheduled"
    SENT = "Sent"
    FAILED = "Failed"

class MessageTemplate(BaseModel):
    template_id: str
    name: str
    trigger_type: TriggerType
    communication_type: CommunicationType
    subject: str
    body: str
    active: bool
    created_date: date

class BroadcastMessage(BaseModel):
    broadcast_id: str
    campus_id: Optional[str] = None
    sender_id: str  # staff_id
    communication_type: CommunicationType
    subject: str
    body: str
    recipient_type: str  # "All Parents", "Grade K", "Session Morning", etc.
    recipient_count: int
    status: BroadcastStatus
    scheduled_date: Optional[datetime] = None
    sent_date: Optional[datetime] = None
    created_date: date

class AutomatedAlert(BaseModel):
    alert_id: str
    trigger_type: TriggerType
    student_id: str
    family_id: str
    triggered_date: datetime
    message_sent: bool
    message_content: str
    communication_type: CommunicationType

class MasteryLevel(str, Enum):
    NOT_ASSESSED = "Not Assessed"
    BEGINNING = "Beginning"
    DEVELOPING = "Developing"
    PROFICIENT = "Proficient"
    ADVANCED = "Advanced"

class AcademicStandard(BaseModel):
    standard_id: str
    subject: str
    grade: str
    code: str  # e.g., "CCSS.MATH.3.OA.A.1"
    description: str
    category: str  # e.g., "Operations & Algebraic Thinking"

class StandardAssessment(BaseModel):
    assessment_id: str
    student_id: str
    standard_id: str
    mastery_level: MasteryLevel
    assessment_date: date
    notes: str
    teacher_id: str

class ProgressReport(BaseModel):
    report_id: str
    student_id: str
    term: str
    generated_date: date
    standards_assessed: int
    proficient_count: int
    developing_count: int
    beginning_count: int
    overall_progress: str  # "On Track", "Needs Support", "Excelling"


class PlanType(str, Enum):
    IEP = "IEP"
    SECTION_504 = "Section 504"

class PlanStatus(str, Enum):
    ACTIVE = "Active"
    UNDER_REVIEW = "Under Review"
    EXPIRED = "Expired"
    DRAFT = "Draft"

class AccommodationType(str, Enum):
    INSTRUCTIONAL = "Instructional"
    ENVIRONMENTAL = "Environmental"
    BEHAVIORAL = "Behavioral"
    ASSESSMENT = "Assessment"
    TECHNOLOGY = "Technology"

class GoalStatus(str, Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    ACHIEVED = "Achieved"
    DISCONTINUED = "Discontinued"

class IEP504Plan(BaseModel):
    plan_id: str
    student_id: str
    campus_id: str
    plan_type: PlanType
    status: PlanStatus
    start_date: date
    end_date: date
    case_manager: str
    disability_category: Optional[str] = None
    meeting_date: date
    next_review_date: date
    parent_consent_date: Optional[date] = None
    notes: str

class Accommodation(BaseModel):
    accommodation_id: str
    plan_id: str
    type: AccommodationType
    description: str
    frequency: str  # "Daily", "As Needed", "During Tests"
    responsible_staff: str
    implementation_notes: str

class IEPGoal(BaseModel):
    goal_id: str
    plan_id: str
    area: str  # "Reading", "Math", "Behavior", "Social Skills"
    goal_description: str
    baseline: str
    target: str
    target_date: date
    status: GoalStatus
    progress_percentage: int
    last_updated: date

class RTITier(str, Enum):
    TIER_1 = "Tier 1"
    TIER_2 = "Tier 2"
    TIER_3 = "Tier 3"

class InterventionStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    DISCONTINUED = "Discontinued"

class InterventionPlan(BaseModel):
    intervention_id: str
    student_id: str
    campus_id: str
    tier: RTITier
    area_of_concern: str  # "Reading", "Math", "Behavior", "Attendance"
    intervention_strategy: str
    start_date: date
    end_date: Optional[date] = None
    frequency: str  # "Daily", "3x per week", "Weekly"
    duration_minutes: int
    staff_responsible: str
    status: InterventionStatus
    baseline_data: str
    target_goal: str

class InterventionProgress(BaseModel):
    progress_id: str
    intervention_id: str
    date: date
    data_point: float
    notes: str
    staff_id: str

class RiskCategory(str, Enum):
    ACADEMIC = "Academic"
    ATTENDANCE = "Attendance"
    BEHAVIOR = "Behavior"
    ENGAGEMENT = "Engagement"

class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class AtRiskAssessment(BaseModel):
    assessment_id: str
    student_id: str
    campus_id: str
    assessment_date: date
    overall_risk_score: int  # 0-100
    overall_risk_level: RiskLevel
    academic_score: int
    attendance_score: int
    behavior_score: int
    engagement_score: int
    risk_factors: List[str]
    recommended_interventions: List[str]
    assessed_by: str

class RetentionPrediction(BaseModel):
    prediction_id: str
    student_id: str
    campus_id: str
    school_year: str
    retention_probability: float  # 0.0-1.0
    risk_level: RiskLevel
    key_factors: List[str]
    recommended_actions: List[str]
    last_updated: date

class EnrollmentForecast(BaseModel):
    forecast_id: str
    campus_id: str
    school_year: str
    grade_level: str
    forecasted_enrollment: int
    confidence_interval_low: int
    confidence_interval_high: int
    based_on_factors: List[str]
    generated_date: date

class AssignmentType(str, Enum):
    PROJECT = "Project"
    QUIZ = "Quiz"
    HOMEWORK = "Homework"
    TEST = "Test"
    OTHER = "Other"

class AssignmentStatus(str, Enum):
    DRAFT = "Draft"
    PUBLISHED = "Published"
    ARCHIVED = "Archived"

class GradeEntryStatus(str, Enum):
    COMPLETE = "Complete"
    MISSING = "Missing"
    LATE = "Late"
    EXCUSED = "Excused"

class Assignment(BaseModel):
    assignment_id: str
    campus_id: str
    teacher_id: str
    room: Room
    subject: str
    assignment_type: AssignmentType
    title: str
    description: str
    max_points: int
    due_date: date
    status: AssignmentStatus
    created_date: date

class GradeEntry(BaseModel):
    entry_id: str
    assignment_id: str
    student_id: str
    campus_id: str
    points_earned: Optional[int]
    letter_grade: Optional[str]
    percentage: Optional[float]
    status: GradeEntryStatus
    comment: Optional[str]
    submitted_date: Optional[date]
    graded_date: Optional[date]
    graded_by: str

class AnnouncementCategory(str, Enum):
    GENERAL = "General"
    ACADEMIC = "Academic"
    EVENTS = "Events"
    EMERGENCY = "Emergency"

class AnnouncementStatus(str, Enum):
    DRAFT = "Draft"
    PENDING_APPROVAL = "Pending Approval"
    PUBLISHED = "Published"
    ARCHIVED = "Archived"

class Announcement(BaseModel):
    announcement_id: str
    campus_id: str
    title: str
    content: str
    category: AnnouncementCategory
    status: AnnouncementStatus
    created_by: str
    created_by_role: StaffRole
    approved_by: Optional[str]
    approved_date: Optional[date]
    published_date: Optional[date]
    expires_date: Optional[date]
    is_pinned: bool
    target_roles: List[str]  # ["Parent", "Teacher", "Admin"]

class AnnouncementRead(BaseModel):
    read_id: str
    announcement_id: str
    user_id: str
    read_date: date

class WorkflowStatus(str, Enum):
    PENDING = "Pending"
    PERMISSION_SLIP_SIGNED = "Permission Slip Signed"
    PAYMENT_COMPLETE = "Payment Complete"
    REGISTERED = "Registered"
    CANCELLED = "Cancelled"

class EventWorkflow(BaseModel):
    workflow_id: str
    event_id: str
    rsvp_id: str
    family_id: str
    student_id: str
    status: WorkflowStatus
    permission_slip_signed: bool
    permission_slip_signature_id: Optional[str]
    payment_complete: bool
    payment_order_id: Optional[str]
    created_date: date
    completed_date: Optional[date]

# Step Up for Students Scholarship Models
class SUFSScholarshipType(str, Enum):
    FES_UA = "FES-UA"  # Family Empowerment Scholarship - Unique Abilities
    FES_EO = "FES-EO"  # Family Empowerment Scholarship - Educational Options
    FTC = "FTC"  # Florida Tax Credit Scholarship
    HOPE = "Hope"  # Hope Scholarship
    NEW_WORLDS = "New Worlds"  # New Worlds Scholarship
    AAA = "AAA"  # Reading Scholarship Accounts

class SUFSClaimStatus(str, Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    PENDING = "Pending"
    APPROVED = "Approved"
    PAID = "Paid"
    DENIED = "Denied"
    PARTIAL = "Partial"

class SUFSPaymentStatus(str, Enum):
    PENDING = "Pending"
    RECEIVED = "Received"
    RECONCILED = "Reconciled"
    DISCREPANCY = "Discrepancy"

class SUFSScholarship(BaseModel):
    scholarship_id: str
    student_id: str
    family_id: str
    campus_id: str
    scholarship_type: SUFSScholarshipType
    award_id: Optional[str] = None  # SUFS Award ID if known
    school_year: str  # e.g., "2025-2026"
    annual_award_amount: float
    quarterly_amount: float
    remaining_balance: float
    start_date: date
    end_date: Optional[date] = None
    status: str = "Active"  # Active, Inactive, Pending
    eligibility_verified: bool = False
    eligibility_verified_date: Optional[date] = None
    notes: Optional[str] = None
    created_date: date
    last_updated: date

class SUFSClaim(BaseModel):
    claim_id: str
    scholarship_id: str
    student_id: str
    family_id: str
    campus_id: str
    claim_period: str  # e.g., "Q1 2025-2026", "October 2025"
    claim_date: date
    amount_claimed: float
    tuition_amount: float
    fees_amount: float
    status: SUFSClaimStatus
    submitted_date: Optional[date] = None
    approved_date: Optional[date] = None
    paid_date: Optional[date] = None
    paid_amount: Optional[float] = None
    denial_reason: Optional[str] = None
    sufs_reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_date: date
    last_updated: date

class SUFSPayment(BaseModel):
    payment_id: str
    campus_id: str
    payment_date: date
    deposit_date: Optional[date] = None
    total_amount: float
    sufs_reference_number: Optional[str] = None
    bank_reference: Optional[str] = None
    status: SUFSPaymentStatus
    reconciled_date: Optional[date] = None
    reconciled_by: Optional[str] = None
    notes: Optional[str] = None
    created_date: date

class SUFSPaymentAllocation(BaseModel):
    allocation_id: str
    payment_id: str
    claim_id: str
    student_id: str
    family_id: str
    amount: float
    status: str  # "Matched", "Discrepancy", "Manual"
    discrepancy_amount: Optional[float] = None
    discrepancy_reason: Optional[str] = None
    created_date: date

class SUFSReconciliationReport(BaseModel):
    report_id: str
    campus_id: str
    report_period: str  # e.g., "October 2025"
    generated_date: date
    total_claims_submitted: float
    total_payments_received: float
    total_outstanding: float
    total_discrepancies: float
    claims_count: int
    payments_count: int
    reconciled_count: int
    discrepancy_count: int

organizations_db: List[Organization] = []
campuses_db: List[Campus] = []
users_db: List[User] = []
audit_logs_db: List[AuditLog] = []
students_db: List[Student] = []
families_db: List[Family] = []
parents_db: List[Parent] = []
staff_db: List[Staff] = []
grade_records_db: List[GradeRecord] = []
behavior_notes_db: List[BehaviorNote] = []
attendance_records_db: List[AttendanceRecord] = []
ixl_summaries_db: List[IXLSummary] = []
acellus_summaries_db: List[AcellusSummary] = []
acellus_courses_db: List[AcellusCourse] = []
billing_records_db: List[BillingRecord] = []
conferences_db: List[Conference] = []
messages_db: List[Message] = []
events_db: List[Event] = []
event_rsvps_db: List[EventRSVP] = []
documents_db: List[Document] = []
document_signatures_db: List[DocumentSignature] = []
products_db: List[Product] = []
orders_db: List[Order] = []
photo_albums_db: List[PhotoAlbum] = []
incidents_db: List[Incident] = []
health_records_db: List[HealthRecord] = []
invoices_db: List[Invoice] = []
invoice_line_items_db: List[InvoiceLineItem] = []
payment_plans_db: List[PaymentPlan] = []
payment_schedules_db: List[PaymentSchedule] = []
leads_db: List[Lead] = []
campus_capacity_db: List[CampusCapacity] = []
message_templates_db: List[MessageTemplate] = []
broadcast_messages_db: List[BroadcastMessage] = []
automated_alerts_db: List[AutomatedAlert] = []
academic_standards_db: List[AcademicStandard] = []
standard_assessments_db: List[StandardAssessment] = []
progress_reports_db: List[ProgressReport] = []
iep_504_plans_db: List[IEP504Plan] = []
accommodations_db: List[Accommodation] = []
iep_goals_db: List[IEPGoal] = []
intervention_plans_db: List[InterventionPlan] = []
intervention_progress_db: List[InterventionProgress] = []
at_risk_assessments_db: List[AtRiskAssessment] = []
retention_predictions_db: List[RetentionPrediction] = []
enrollment_forecasts_db: List[EnrollmentForecast] = []
assignments_db: List[Assignment] = []
grade_entries_db: List[GradeEntry] = []
announcements_db: List[Announcement] = []
announcement_reads_db: List[AnnouncementRead] = []
event_workflows_db: List[EventWorkflow] = []
sufs_scholarships_db: List[SUFSScholarship] = []
sufs_claims_db: List[SUFSClaim] = []
sufs_payments_db: List[SUFSPayment] = []
sufs_payment_allocations_db: List[SUFSPaymentAllocation] = []

def load_data_from_db():
    """Load all data from the SQLite database into in-memory lists for fast reads."""
    global organizations_db, campuses_db, users_db, audit_logs_db
    global students_db, families_db, parents_db, staff_db, grade_records_db
    global behavior_notes_db, attendance_records_db, ixl_summaries_db
    global acellus_summaries_db, acellus_courses_db
    global billing_records_db, conferences_db, messages_db
    global events_db, event_rsvps_db, documents_db, document_signatures_db
    global products_db, orders_db, photo_albums_db, incidents_db, health_records_db
    global invoices_db, invoice_line_items_db, payment_plans_db, payment_schedules_db
    global leads_db, campus_capacity_db, message_templates_db, broadcast_messages_db
    global automated_alerts_db, academic_standards_db, standard_assessments_db, progress_reports_db
    global iep_504_plans_db, accommodations_db, iep_goals_db
    global intervention_plans_db, intervention_progress_db
    global at_risk_assessments_db, retention_predictions_db, enrollment_forecasts_db
    global assignments_db, grade_entries_db, announcements_db, announcement_reads_db, event_workflows_db
    global sufs_scholarships_db, sufs_claims_db, sufs_payments_db, sufs_payment_allocations_db

    data = db_utils.load_all_from_db()

    # Convert dicts back to Pydantic models for each entity type
    organizations_db = [Organization(**d) for d in data.get("organizations", [])]
    campuses_db = [Campus(**d) for d in data.get("campuses", [])]
    users_db = [User(**d) for d in data.get("users", [])]
    audit_logs_db = [AuditLog(**d) for d in data.get("audit_logs", [])]
    students_db = [Student(**d) for d in data.get("students", [])]
    families_db = [Family(**d) for d in data.get("families", [])]
    parents_db = [Parent(**d) for d in data.get("parents", [])]
    staff_db = [Staff(**d) for d in data.get("staff", [])]
    grade_records_db = [GradeRecord(**d) for d in data.get("grade_records", [])]
    behavior_notes_db = [BehaviorNote(**d) for d in data.get("behavior_notes", [])]
    attendance_records_db = [AttendanceRecord(**d) for d in data.get("attendance_records", [])]
    ixl_summaries_db = [IXLSummary(**d) for d in data.get("ixl_summaries", [])]
    acellus_summaries_db = [AcellusSummary(**d) for d in data.get("acellus_summaries", [])]
    acellus_courses_db = [AcellusCourse(**d) for d in data.get("acellus_courses", [])]
    billing_records_db = [BillingRecord(**d) for d in data.get("billing_records", [])]
    conferences_db = [Conference(**d) for d in data.get("conferences", [])]
    messages_db = [Message(**d) for d in data.get("messages", [])]
    events_db = [Event(**d) for d in data.get("events", [])]
    event_rsvps_db = [EventRSVP(**d) for d in data.get("event_rsvps", [])]
    documents_db = [Document(**d) for d in data.get("documents", [])]
    document_signatures_db = [DocumentSignature(**d) for d in data.get("document_signatures", [])]
    products_db = [Product(**d) for d in data.get("products", [])]
    orders_db = [Order(**d) for d in data.get("orders", [])]
    photo_albums_db = [PhotoAlbum(**d) for d in data.get("photo_albums", [])]
    incidents_db = [Incident(**d) for d in data.get("incidents", [])]
    health_records_db = [HealthRecord(**d) for d in data.get("health_records", [])]
    invoices_db = [Invoice(**d) for d in data.get("invoices", [])]
    invoice_line_items_db = [InvoiceLineItem(**d) for d in data.get("invoice_line_items", [])]
    payment_plans_db = [PaymentPlan(**d) for d in data.get("payment_plans", [])]
    payment_schedules_db = [PaymentSchedule(**d) for d in data.get("payment_schedules", [])]
    leads_db = [Lead(**d) for d in data.get("leads", [])]
    campus_capacity_db = [CampusCapacity(**d) for d in data.get("campus_capacity", [])]
    message_templates_db = [MessageTemplate(**d) for d in data.get("message_templates", [])]
    broadcast_messages_db = [BroadcastMessage(**d) for d in data.get("broadcast_messages", [])]
    automated_alerts_db = [AutomatedAlert(**d) for d in data.get("automated_alerts", [])]
    academic_standards_db = [AcademicStandard(**d) for d in data.get("academic_standards", [])]
    standard_assessments_db = [StandardAssessment(**d) for d in data.get("standard_assessments", [])]
    progress_reports_db = [ProgressReport(**d) for d in data.get("progress_reports", [])]
    iep_504_plans_db = [IEP504Plan(**d) for d in data.get("iep_504_plans", [])]
    accommodations_db = [Accommodation(**d) for d in data.get("accommodations", [])]
    iep_goals_db = [IEPGoal(**d) for d in data.get("iep_goals", [])]
    intervention_plans_db = [InterventionPlan(**d) for d in data.get("intervention_plans", [])]
    intervention_progress_db = [InterventionProgress(**d) for d in data.get("intervention_progress", [])]
    at_risk_assessments_db = [AtRiskAssessment(**d) for d in data.get("at_risk_assessments", [])]
    retention_predictions_db = [RetentionPrediction(**d) for d in data.get("retention_predictions", [])]
    enrollment_forecasts_db = [EnrollmentForecast(**d) for d in data.get("enrollment_forecasts", [])]
    assignments_db = [Assignment(**d) for d in data.get("assignments", [])]
    grade_entries_db = [GradeEntry(**d) for d in data.get("grade_entries", [])]
    announcements_db = [Announcement(**d) for d in data.get("announcements", [])]
    announcement_reads_db = [AnnouncementRead(**d) for d in data.get("announcement_reads", [])]
    event_workflows_db = [EventWorkflow(**d) for d in data.get("event_workflows", [])]
    sufs_scholarships_db = [SUFSScholarship(**d) for d in data.get("sufs_scholarships", [])]
    sufs_claims_db = [SUFSClaim(**d) for d in data.get("sufs_claims", [])]
    sufs_payments_db = [SUFSPayment(**d) for d in data.get("sufs_payments", [])]
    sufs_payment_allocations_db = [SUFSPaymentAllocation(**d) for d in data.get("sufs_payment_allocations", [])]

    print(f"Loaded data from database: {len(students_db)} students, {len(families_db)} families, {len(staff_db)} staff")

@app.on_event("startup")
async def startup_event():
    load_data_from_db()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/organizations", response_model=List[Organization])
async def get_organizations():
    return organizations_db

@app.get("/api/organizations/{organization_id}", response_model=Organization)
async def get_organization(organization_id: str):
    org = next((o for o in organizations_db if o.organization_id == organization_id), None)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@app.get("/api/campuses", response_model=List[Campus])
async def get_campuses(organization_id: Optional[str] = None):
    filtered_campuses = campuses_db
    if organization_id:
        filtered_campuses = [c for c in filtered_campuses if c.organization_id == organization_id]
    return filtered_campuses

@app.get("/api/campuses/{campus_id}", response_model=Campus)
async def get_campus(campus_id: str):
    campus = next((c for c in campuses_db if c.campus_id == campus_id), None)
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    return campus

@app.get("/api/users", response_model=List[User])
async def get_users(role: Optional[UserRole] = None, campus_id: Optional[str] = None):
    filtered_users = users_db
    if role:
        filtered_users = [u for u in filtered_users if u.role == role]
    if campus_id:
        filtered_users = [u for u in filtered_users if campus_id in u.campus_ids]
    return filtered_users

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = next((u for u in users_db if u.user_id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/students", response_model=List[Student])
async def get_students(
    campus_id: Optional[str] = None,
    family_id: Optional[str] = None,
    grade: Optional[str] = None,
    session: Optional[Session] = None,
    room: Optional[Room] = None,
    billing_status: Optional[BillingStatus] = None,
    risk_flag: Optional[RiskFlag] = None,
    ixl_status: Optional[IXLStatus] = None
):
    filtered_students = students_db
    
    if campus_id:
        filtered_students = [s for s in filtered_students if s.campus_id == campus_id]
    if family_id:
        filtered_students = [s for s in filtered_students if s.family_id == family_id]
    if grade:
        filtered_students = [s for s in filtered_students if s.grade == grade]
    if session:
        filtered_students = [s for s in filtered_students if s.session == session]
    if room:
        filtered_students = [s for s in filtered_students if s.room == room]
    if risk_flag:
        filtered_students = [s for s in filtered_students if s.overall_risk_flag == risk_flag]
    if ixl_status:
        filtered_students = [s for s in filtered_students if s.ixl_status_flag == ixl_status]
    if billing_status:
        family_ids = [f.family_id for f in families_db if f.billing_status == billing_status]
        filtered_students = [s for s in filtered_students if s.family_id in family_ids]
    
    return filtered_students

@app.get("/api/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    student = next((s for s in students_db if s.student_id == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.post("/api/students", response_model=Student)
async def create_student(student: Student):
    if any(s.student_id == student.student_id for s in students_db):
        raise HTTPException(status_code=400, detail="Student ID already exists")
    
    campus = next((c for c in campuses_db if c.campus_id == student.campus_id), None)
    if not campus:
        raise HTTPException(status_code=400, detail="Invalid campus_id")
    
    family = next((f for f in families_db if f.family_id == student.family_id), None)
    if not family:
        raise HTTPException(status_code=400, detail="Invalid family_id")
    
    students_db.append(student)
    db_utils.save_student(student)
    
    family.student_ids.append(student.student_id)
    db_utils.save_family(family)
    
    return student

@app.put("/api/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_data: dict):
    student = next((s for s in students_db if s.student_id == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, value in student_data.items():
        if hasattr(student, key) and key != "student_id":
            setattr(student, key, value)
    db_utils.save_student(student)
    return student

@app.delete("/api/students/{student_id}")
async def delete_student(student_id: str):
    global students_db
    student = next((s for s in students_db if s.student_id == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    # Remove student from family's student_ids
    family = next((f for f in families_db if f.family_id == student.family_id), None)
    if family and student_id in family.student_ids:
        family.student_ids.remove(student_id)
        db_utils.save_family(family)
    students_db = [s for s in students_db if s.student_id != student_id]
    db_utils.delete_student(student_id)
    return {"message": "Student deleted successfully"}

@app.get("/api/students/export/csv")
async def export_students_csv(campus_id: Optional[str] = None):
    filtered_students = students_db
    if campus_id:
        filtered_students = [s for s in filtered_students if s.campus_id == campus_id]
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Student ID", "Campus ID", "First Name", "Last Name", "Date of Birth", 
        "Grade", "Session", "Room", "Status", "Family ID", "Enrollment Start Date",
        "Funding Source", "Step-Up %", "Overall Grade", "IXL Status", "Risk Flag"
    ])
    
    for student in filtered_students:
        writer.writerow([
            student.student_id, student.campus_id, student.first_name, student.last_name,
            student.date_of_birth, student.grade, student.session, student.room,
            student.status, student.family_id, student.enrollment_start_date,
            student.funding_source, student.step_up_percentage, student.overall_grade_flag,
            student.ixl_status_flag, student.overall_risk_flag
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_export.csv"}
    )

@app.get("/api/families", response_model=List[Family])
async def get_families(billing_status: Optional[BillingStatus] = None):
    if billing_status:
        return [f for f in families_db if f.billing_status == billing_status]
    return families_db

@app.get("/api/families/{family_id}", response_model=Family)
async def get_family(family_id: str):
    family = next((f for f in families_db if f.family_id == family_id), None)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    return family

@app.post("/api/families", response_model=Family)
async def create_family(family: Family):
    if any(f.family_id == family.family_id for f in families_db):
        raise HTTPException(status_code=400, detail="Family ID already exists")
    families_db.append(family)
    db_utils.save_family(family)
    return family

@app.put("/api/families/{family_id}", response_model=Family)
async def update_family(family_id: str, family_data: dict):
    family = next((f for f in families_db if f.family_id == family_id), None)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    for key, value in family_data.items():
        if hasattr(family, key) and key != "family_id":
            setattr(family, key, value)
    db_utils.save_family(family)
    return family

@app.delete("/api/families/{family_id}")
async def delete_family(family_id: str):
    global families_db
    family = next((f for f in families_db if f.family_id == family_id), None)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    families_db = [f for f in families_db if f.family_id != family_id]
    db_utils.delete_family(family_id)
    return {"message": "Family deleted successfully"}

@app.get("/api/parents", response_model=List[Parent])
async def get_parents():
    return parents_db

@app.get("/api/parents/{parent_id}", response_model=Parent)
async def get_parent(parent_id: str):
    parent = next((p for p in parents_db if p.parent_id == parent_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent

@app.post("/api/parents", response_model=Parent)
async def create_parent(parent: Parent):
    if any(p.parent_id == parent.parent_id for p in parents_db):
        raise HTTPException(status_code=400, detail="Parent ID already exists")
    parents_db.append(parent)
    db_utils.save_parent(parent)
    return parent

@app.put("/api/parents/{parent_id}", response_model=Parent)
async def update_parent(parent_id: str, parent_data: dict):
    parent = next((p for p in parents_db if p.parent_id == parent_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    for key, value in parent_data.items():
        if hasattr(parent, key) and key != "parent_id":
            setattr(parent, key, value)
    db_utils.save_parent(parent)
    return parent

@app.delete("/api/parents/{parent_id}")
async def delete_parent(parent_id: str):
    global parents_db
    parent = next((p for p in parents_db if p.parent_id == parent_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    parents_db = [p for p in parents_db if p.parent_id != parent_id]
    db_utils.delete_parent(parent_id)
    return {"message": "Parent deleted successfully"}

@app.get("/api/staff", response_model=List[Staff])
async def get_staff():
    return staff_db

@app.get("/api/staff/{staff_id}", response_model=Staff)
async def get_staff_member(staff_id: str):
    staff = next((s for s in staff_db if s.staff_id == staff_id), None)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff

@app.get("/api/grades/{student_id}", response_model=List[GradeRecord])
async def get_grades(student_id: str):
    return [g for g in grade_records_db if g.student_id == student_id]

@app.post("/api/grades", response_model=GradeRecord)
async def create_grade_record(grade_record: GradeRecord):
    if any(g.grade_record_id == grade_record.grade_record_id for g in grade_records_db):
        raise HTTPException(status_code=400, detail="Grade record ID already exists")
    student = next((s for s in students_db if s.student_id == grade_record.student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    grade_records_db.append(grade_record)
    db_utils.save_grade_record(grade_record)
    return grade_record

@app.get("/api/behavior/{student_id}", response_model=List[BehaviorNote])
async def get_behavior_notes(student_id: str):
    return [b for b in behavior_notes_db if b.student_id == student_id]

@app.post("/api/behavior", response_model=BehaviorNote)
async def create_behavior_note(behavior_note: BehaviorNote):
    if any(b.behavior_note_id == behavior_note.behavior_note_id for b in behavior_notes_db):
        raise HTTPException(status_code=400, detail="Behavior note ID already exists")
    student = next((s for s in students_db if s.student_id == behavior_note.student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    behavior_notes_db.append(behavior_note)
    db_utils.save_behavior_note(behavior_note)
    return behavior_note

@app.get("/api/attendance/{student_id}", response_model=List[AttendanceRecord])
async def get_attendance(student_id: str):
    return [a for a in attendance_records_db if a.student_id == student_id]

class AttendanceSubmission(BaseModel):
    student_id: str
    status: AttendanceStatus
    session: Session

@app.post("/api/attendance/take")
async def take_attendance(attendance_list: List[AttendanceSubmission]):
    """
    Take attendance for multiple students at once.
    Creates attendance records for today's date.
    """
    today = date.today()
    created_records = []
    
    for submission in attendance_list:
        student = next((s for s in students_db if s.student_id == submission.student_id), None)
        if not student:
            raise HTTPException(status_code=404, detail=f"Student {submission.student_id} not found")
        
        existing = next((a for a in attendance_records_db 
                        if a.student_id == submission.student_id 
                        and a.date == today 
                        and a.session == submission.session), None)
        
        if existing:
            existing.status = submission.status
            db_utils.save_attendance(existing)
            created_records.append(existing)
        else:
            attendance_id = f"att_{uuid.uuid4().hex[:8]}"
            new_record = AttendanceRecord(
                attendance_id=attendance_id,
                student_id=submission.student_id,
                date=today,
                status=submission.status,
                session=submission.session
            )
            attendance_records_db.append(new_record)
            db_utils.save_attendance(new_record)
            created_records.append(new_record)
            
            if submission.status == AttendanceStatus.PRESENT:
                student.attendance_present_count += 1
            elif submission.status == AttendanceStatus.ABSENT:
                student.attendance_absent_count += 1
            elif submission.status == AttendanceStatus.TARDY:
                student.attendance_tardy_count += 1
            db_utils.save_student(student)
    
    return {"message": f"Attendance recorded for {len(created_records)} students", "records": created_records}

@app.get("/api/ixl/{student_id}", response_model=IXLSummary)
async def get_ixl_summary(student_id: str):
    ixl = next((i for i in ixl_summaries_db if i.student_id == student_id), None)
    if not ixl:
        raise HTTPException(status_code=404, detail="IXL summary not found")
    return ixl

@app.get("/api/ixl", response_model=List[IXLSummary])
async def get_all_ixl():
    return ixl_summaries_db

@app.get("/api/acellus/{student_id}", response_model=AcellusSummary)
async def get_acellus_summary(student_id: str):
    acellus = next((a for a in acellus_summaries_db if a.student_id == student_id), None)
    if not acellus:
        raise HTTPException(status_code=404, detail="Acellus summary not found")
    return acellus

@app.get("/api/acellus", response_model=List[AcellusSummary])
async def get_all_acellus():
    return acellus_summaries_db

@app.get("/api/acellus/{student_id}/courses", response_model=List[AcellusCourse])
async def get_acellus_courses(student_id: str):
    return [c for c in acellus_courses_db if c.student_id == student_id]

@app.get("/api/acellus-courses", response_model=List[AcellusCourse])
async def get_all_acellus_courses():
    return acellus_courses_db

@app.get("/api/billing/{family_id}", response_model=List[BillingRecord])
async def get_billing_records(family_id: str):
    return [b for b in billing_records_db if b.family_id == family_id]

@app.post("/api/billing", response_model=BillingRecord)
async def create_billing_record(billing_record: BillingRecord):
    if any(b.billing_record_id == billing_record.billing_record_id for b in billing_records_db):
        raise HTTPException(status_code=400, detail="Billing record ID already exists")
    family = next((f for f in families_db if f.family_id == billing_record.family_id), None)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    billing_records_db.append(billing_record)
    db_utils.save_billing_record(billing_record)
    # Update family balance if it's a payment
    if billing_record.type == "Payment":
        family.current_balance = max(0, family.current_balance - billing_record.amount)
        family.last_payment_date = billing_record.date
        family.last_payment_amount = billing_record.amount
        db_utils.save_family(family)
    return billing_record

@app.get("/api/conferences", response_model=List[Conference])
async def get_conferences(student_id: Optional[str] = None, parent_id: Optional[str] = None):
    conferences = conferences_db
    if student_id:
        conferences = [c for c in conferences if c.student_id == student_id]
    if parent_id:
        conferences = [c for c in conferences if c.parent_id == parent_id]
    return conferences

@app.post("/api/conferences", response_model=Conference)
async def create_conference(conference: Conference):
    if any(c.conference_id == conference.conference_id for c in conferences_db):
        raise HTTPException(status_code=400, detail="Conference ID already exists")
    conferences_db.append(conference)
    db_utils.save_conference(conference)
    return conference

@app.put("/api/conferences/{conference_id}", response_model=Conference)
async def update_conference(conference_id: str, conference_data: dict):
    conference = next((c for c in conferences_db if c.conference_id == conference_id), None)
    if not conference:
        raise HTTPException(status_code=404, detail="Conference not found")
    for key, value in conference_data.items():
        if hasattr(conference, key) and key != "conference_id":
            setattr(conference, key, value)
    db_utils.save_conference(conference)
    return conference

@app.get("/api/messages", response_model=List[Message])
async def get_messages(parent_id: Optional[str] = None, staff_id: Optional[str] = None):
    messages = messages_db
    if parent_id:
        messages = [m for m in messages if m.sender_id == parent_id or m.recipient_id == parent_id]
    if staff_id:
        messages = [m for m in messages if m.sender_id == staff_id or m.recipient_id == staff_id]
    return messages

@app.post("/api/messages", response_model=Message)
async def create_message(message: Message):
    if any(m.message_id == message.message_id for m in messages_db):
        raise HTTPException(status_code=400, detail="Message ID already exists")
    messages_db.append(message)
    db_utils.save_message(message)
    return message

@app.get("/api/dashboard/admin")
async def get_admin_dashboard(campus_id: Optional[str] = None):
    filtered_students = students_db if not campus_id else [s for s in students_db if s.campus_id == campus_id]
    
    total_students = len(filtered_students)
    morning_count = len([s for s in filtered_students if s.session == Session.MORNING])
    afternoon_count = len([s for s in filtered_students if s.session == Session.AFTERNOON])
    
    student_family_ids = set(s.family_id for s in filtered_students)
    filtered_families = families_db if not campus_id else [f for f in families_db if f.family_id in student_family_ids]
    
    billing_green = len([f for f in filtered_families if f.billing_status == BillingStatus.GREEN])
    billing_yellow = len([f for f in filtered_families if f.billing_status == BillingStatus.YELLOW])
    billing_red = len([f for f in filtered_families if f.billing_status == BillingStatus.RED])
    total_balance = sum(f.current_balance for f in filtered_families)
    
    today = date.today()
    student_ids = set(s.student_id for s in filtered_students)
    today_attendance = [a for a in attendance_records_db if a.date == today and (not campus_id or a.student_id in student_ids)]
    present_today = len([a for a in today_attendance if a.status == AttendanceStatus.PRESENT])
    absent_today = len([a for a in today_attendance if a.status == AttendanceStatus.ABSENT])
    tardy_today = len([a for a in today_attendance if a.status == AttendanceStatus.TARDY])
    
    at_risk_students = [s for s in filtered_students if s.overall_risk_flag == RiskFlag.AT_RISK]
    ixl_behind = [s for s in filtered_students if s.ixl_status_flag == IXLStatus.NEEDS_ATTENTION]
    overdue_families = [f for f in filtered_families if f.billing_status == BillingStatus.RED]
    
    return {
        "total_students": total_students,
        "morning_count": morning_count,
        "afternoon_count": afternoon_count,
        "total_families": len(families_db),
        "billing_summary": {
            "green": billing_green,
            "yellow": billing_yellow,
            "red": billing_red,
            "total_balance": round(total_balance, 2)
        },
        "attendance_today": {
            "present": present_today,
            "absent": absent_today,
            "tardy": tardy_today
        },
        "alerts": {
            "at_risk_students": len(at_risk_students),
            "ixl_behind": len(ixl_behind),
            "overdue_families": len(overdue_families)
        }
    }

@app.get("/api/dashboard/teacher/{staff_id}")
async def get_teacher_dashboard(staff_id: str):
    staff = next((s for s in staff_db if s.staff_id == staff_id), None)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    rooms_data = []
    for room_session in staff.assigned_rooms:
        room_parts = room_session.split(" - ")
        room_name = room_parts[0]
        session_name = room_parts[1] if len(room_parts) > 1 else "Morning"
        
        room_students = [s for s in students_db if s.room.value == room_name and s.session.value == session_name]
        
        rooms_data.append({
            "room": room_name,
            "session": session_name,
            "student_count": len(room_students),
            "students": room_students
        })
    
    return {
        "staff": staff,
        "rooms": rooms_data
    }

@app.get("/api/dashboard/parent/{parent_id}")
async def get_parent_dashboard(parent_id: str):
    parent = next((p for p in parents_db if p.parent_id == parent_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    children = [s for s in students_db if s.student_id in parent.student_ids]
    family = next((f for f in families_db if parent_id in f.parent_ids), None)
    
    return {
        "parent": parent,
        "children": children,
        "family": family
    }

@app.get("/api/ask-auvora")
async def ask_auvora(query: str = Query(..., description="Natural language query")):
    query_lower = query.lower()
    results = []
    result_type = "students"
    
    if "not up to date" in query_lower or "overdue" in query_lower or "behind on payment" in query_lower:
        families = [f for f in families_db if f.billing_status == BillingStatus.RED]
        student_ids = [sid for f in families for sid in f.student_ids]
        results = [s for s in students_db if s.student_id in student_ids]
        result_type = "students"
    
    elif "balance over" in query_lower or "balance >" in query_lower:
        try:
            amount = float(''.join(filter(str.isdigit, query)))
            families = [f for f in families_db if f.current_balance > amount]
            result_type = "families"
            results = families
        except:
            pass
    
    elif "yellow or red" in query_lower or "yellow and red" in query_lower:
        families = [f for f in families_db if f.billing_status in [BillingStatus.YELLOW, BillingStatus.RED]]
        result_type = "families"
        results = families
    
    elif "absent" in query_lower or "absences" in query_lower:
        try:
            threshold = int(''.join(filter(str.isdigit, query)))
            results = [s for s in students_db if s.attendance_absent_count > threshold]
        except:
            results = [s for s in students_db if s.attendance_absent_count > 3]
        result_type = "students"
    
    elif "tardy" in query_lower or "tardies" in query_lower:
        try:
            threshold = int(''.join(filter(str.isdigit, query)))
            results = [s for s in students_db if s.attendance_tardy_count > threshold]
        except:
            results = [s for s in students_db if s.attendance_tardy_count > 5]
        result_type = "students"
    
    elif "failing" in query_lower:
        results = [s for s in students_db if s.overall_grade_flag == GradeFlag.FAILING]
        result_type = "students"
    
    elif "poor grades" in query_lower and "poor attendance" in query_lower:
        results = [s for s in students_db if s.overall_grade_flag != GradeFlag.ON_TRACK and s.attendance_absent_count > 2]
        result_type = "students"
    
    elif "at risk" in query_lower or "at-risk" in query_lower:
        results = [s for s in students_db if s.overall_risk_flag == RiskFlag.AT_RISK]
        result_type = "students"
    
    elif "ixl" in query_lower and ("behind" in query_lower or "needs attention" in query_lower):
        results = [s for s in students_db if s.ixl_status_flag == IXLStatus.NEEDS_ATTENTION]
        result_type = "students"
    
    elif "not active" in query_lower and "ixl" in query_lower:
        try:
            days = int(''.join(filter(str.isdigit, query)))
            cutoff_date = date.today() - timedelta(days=days)
            ixl_inactive = [i for i in ixl_summaries_db if i.last_active_date < cutoff_date]
            inactive_student_ids = [i.student_id for i in ixl_inactive]
            results = [s for s in students_db if s.student_id in inactive_student_ids]
        except:
            pass
        result_type = "students"
    
    elif "weekly hours" in query_lower and "less than" in query_lower:
        try:
            hours = float(''.join(filter(str.isdigit, query)))
            ixl_low = [i for i in ixl_summaries_db if i.weekly_hours < hours]
            low_student_ids = [i.student_id for i in ixl_low]
            results = [s for s in students_db if s.student_id in low_student_ids]
        except:
            pass
        result_type = "students"
    
    return {
        "query": query,
        "result_type": result_type,
        "count": len(results),
        "results": results
    }


# AI Chat Request/Response Models
class AIChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class AIChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[AIChatMessage]] = []
    user_role: Optional[str] = "admin"

class AIChatResponse(BaseModel):
    response: str
    functions_called: Optional[List[str]] = []
    data_retrieved: Optional[bool] = False
    error: Optional[str] = None


@app.post("/api/ai/chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest):
    """
    AI-powered chat endpoint using GPT-4 with function calling.
    The AI can query business data and provide intelligent responses.
    """
    # Build data context with all database data
    data_context = {
        "students": students_db,
        "families": families_db,
        "parents": parents_db,
        "staff": staff_db,
        "billing_records": billing_records_db,
        "attendance_records": attendance_records_db,
        "ixl_summaries": ixl_summaries_db,
        "acellus_summaries": acellus_summaries_db,
        "acellus_courses": acellus_courses_db,
        "grade_records": grade_records_db,
        "behavior_notes": behavior_notes_db,
        "events": events_db,
        "incidents": incidents_db,
        "leads": leads_db,
        "sufs_scholarships": sufs_scholarships_db,
        "sufs_claims": sufs_claims_db,
        "sufs_payments": sufs_payments_db,
    }
    
    # Convert conversation history to the format expected by the AI agent
    history = [
        {"role": msg.role, "content": msg.content}
        for msg in (request.conversation_history or [])
    ]
    
    # Call the AI agent
    result = await chat_with_auvora(
        user_message=request.message,
        conversation_history=history,
        data_context=data_context,
        user_role=request.user_role or "admin"
    )
    
    return AIChatResponse(
        response=result.get("response", "I'm sorry, I couldn't process your request."),
        functions_called=result.get("functions_called", []),
        data_retrieved=result.get("data_retrieved", False),
        error=result.get("error")
    )


@app.get("/api/ai/status")
async def ai_status():
    """Check if the AI agent is properly configured"""
    api_key = os.environ.get("OPENAI_API_KEY")
    return {
        "configured": api_key is not None and len(api_key) > 0,
        "model": "gpt-4o",
        "capabilities": [
            "Natural language Q&A about students, families, staff",
            "Billing and scholarship inquiries",
            "Attendance and learning progress reports",
            "Lead pipeline and enrollment tracking",
            "Event and incident reporting"
        ]
    }


@app.get("/api/events")
async def get_events():
    return events_db

@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    event = next((e for e in events_db if e.event_id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.get("/api/events/{event_id}/rsvps")
async def get_event_rsvps(event_id: str):
    return [r for r in event_rsvps_db if r.event_id == event_id]

@app.post("/api/events", response_model=Event)
async def create_event(event: Event):
    if any(e.event_id == event.event_id for e in events_db):
        raise HTTPException(status_code=400, detail="Event ID already exists")
    events_db.append(event)
    db_utils.save_event(event)
    return event

@app.put("/api/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: dict):
    event = next((e for e in events_db if e.event_id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in event_data.items():
        if hasattr(event, key) and key != "event_id":
            setattr(event, key, value)
    db_utils.save_event(event)
    return event

@app.delete("/api/events/{event_id}")
async def delete_event(event_id: str):
    global events_db
    event = next((e for e in events_db if e.event_id == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    events_db = [e for e in events_db if e.event_id != event_id]
    db_utils.delete_event(event_id)
    return {"message": "Event deleted successfully"}

@app.get("/api/rsvps")
async def get_rsvps(family_id: Optional[str] = None):
    if family_id:
        return [r for r in event_rsvps_db if r.family_id == family_id]
    return event_rsvps_db

@app.post("/api/rsvps")
async def create_rsvp(rsvp: EventRSVP):
    event_rsvps_db.append(rsvp)
    db_utils.save_rsvp(rsvp)
    return rsvp

@app.put("/api/rsvps/{rsvp_id}")
async def update_rsvp(rsvp_id: str, status: RSVPStatus):
    rsvp = next((r for r in event_rsvps_db if r.rsvp_id == rsvp_id), None)
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    rsvp.status = status
    rsvp.response_date = datetime.now()
    db_utils.save_rsvp(rsvp)
    return rsvp

@app.get("/api/documents")
async def get_documents(student_id: Optional[str] = None):
    if student_id:
        student = next((s for s in students_db if s.student_id == student_id), None)
        if student:
            return [d for d in documents_db if d.required_for == "All Students" or student.grade in d.required_for]
    return documents_db

@app.get("/api/documents/{document_id}")
async def get_document(document_id: str):
    document = next((d for d in documents_db if d.document_id == document_id), None)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/api/documents/{document_id}/signatures")
async def get_document_signatures(document_id: str):
    return [s for s in document_signatures_db if s.document_id == document_id]

@app.get("/api/signatures")
async def get_signatures(parent_id: Optional[str] = None):
    if parent_id:
        return [s for s in document_signatures_db if s.parent_id == parent_id]
    return document_signatures_db

@app.post("/api/signatures")
async def create_signature(signature: DocumentSignature):
    document_signatures_db.append(signature)
    db_utils.save_signature(signature)
    document = next((d for d in documents_db if d.document_id == signature.document_id), None)
    if document:
        document.status = DocumentStatus.SIGNED
    return signature

@app.get("/api/products")
async def get_products(category: Optional[ProductCategory] = None):
    if category:
        return [p for p in products_db if p.category == category]
    return products_db

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    product = next((p for p in products_db if p.product_id == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/products")
async def create_product(product: Product):
    products_db.append(product)
    db_utils.save_product(product)
    return product

@app.put("/api/products/{product_id}")
async def update_product(product_id: str, product_data: dict):
    product = next((p for p in products_db if p.product_id == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in product_data.items():
        if hasattr(product, key):
            setattr(product, key, value)
    db_utils.save_product(product)
    return product

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str):
    global products_db
    product = next((p for p in products_db if p.product_id == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    products_db = [p for p in products_db if p.product_id != product_id]
    db_utils.delete_product(product_id)
    return {"message": "Product deleted successfully"}

@app.get("/api/orders")
async def get_orders(family_id: Optional[str] = None):
    if family_id:
        return [o for o in orders_db if o.family_id == family_id]
    return orders_db

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    order = next((o for o in orders_db if o.order_id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/api/orders")
async def create_order(order: Order):
    orders_db.append(order)
    db_utils.save_order(order)
    return order

@app.put("/api/orders/{order_id}")
async def update_order(order_id: str, status: OrderStatus):
    order = next((o for o in orders_db if o.order_id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    if status == OrderStatus.PAID:
        order.payment_date = datetime.now()
    db_utils.save_order(order)
    return order

@app.get("/api/photo-albums")
async def get_photo_albums(grade: Optional[str] = None):
    if grade:
        return [a for a in photo_albums_db if a.status == PhotoAlbumStatus.PUBLISHED and (grade in a.visible_to_grades or "All" in a.visible_to_grades)]
    return [a for a in photo_albums_db if a.status == PhotoAlbumStatus.PUBLISHED]

@app.get("/api/photo-albums/{album_id}")
async def get_photo_album(album_id: str):
    album = next((a for a in photo_albums_db if a.album_id == album_id), None)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@app.post("/api/photo-albums")
async def create_photo_album(album: PhotoAlbum):
    photo_albums_db.append(album)
    db_utils.save_photo_album(album)
    return album

@app.get("/api/incidents")
async def get_incidents(student_id: Optional[str] = None):
    if student_id:
        return [i for i in incidents_db if i.student_id == student_id]
    return incidents_db

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    incident = next((i for i in incidents_db if i.incident_id == incident_id), None)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@app.post("/api/incidents")
async def create_incident(incident: Incident):
    incidents_db.append(incident)
    db_utils.save_incident(incident)
    return incident

@app.get("/api/health-records")
async def get_health_records(student_id: Optional[str] = None):
    if student_id:
        return [h for h in health_records_db if h.student_id == student_id]
    return health_records_db

@app.get("/api/health-records/{health_record_id}")
async def get_health_record(health_record_id: str):
    health_record = next((h for h in health_records_db if h.health_record_id == health_record_id), None)
    if not health_record:
        raise HTTPException(status_code=404, detail="Health record not found")
    return health_record

@app.put("/api/health-records/{health_record_id}")
async def update_health_record(health_record_id: str, health_record: HealthRecord):
    existing = next((h for h in health_records_db if h.health_record_id == health_record_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Health record not found")
    health_records_db.remove(existing)
    health_records_db.append(health_record)
    db_utils.save_health_record(health_record)
    return health_record


@app.get("/api/revenue/monthly")
async def get_monthly_revenue(month: Optional[str] = None):
    """Get revenue breakdown for a specific month (YYYY-MM format) or all months"""
    from collections import defaultdict
    
    payments = [b for b in billing_records_db if b.type == "Payment"]
    
    if month:
        payments = [p for p in payments if p.period_month == month]
    
    monthly_data = defaultdict(lambda: {
        'tuition_step_up': 0.0,
        'tuition_out_of_pocket': 0.0,
        'fee_step_up': 0.0,
        'fee_out_of_pocket': 0.0,
        'store_step_up': 0.0,
        'store_out_of_pocket': 0.0,
        'other_step_up': 0.0,
        'other_out_of_pocket': 0.0
    })
    
    for payment in payments:
        if not payment.period_month:
            continue
            
        month_key = payment.period_month
        category = payment.category.value if payment.category else 'Other'
        source = payment.source.value if payment.source else 'Out-of-Pocket'
        
        amount = abs(payment.amount)
        
        key = f"{category.lower()}_{source.lower().replace('-', '_')}"
        if key in monthly_data[month_key]:
            monthly_data[month_key][key] += amount
    
    result = []
    for month_key, data in sorted(monthly_data.items()):
        tuition_total = data['tuition_step_up'] + data['tuition_out_of_pocket']
        fee_total = data['fee_step_up'] + data['fee_out_of_pocket']
        store_total = data['store_step_up'] + data['store_out_of_pocket']
        other_total = data['other_step_up'] + data['other_out_of_pocket']
        
        step_up_total = data['tuition_step_up'] + data['fee_step_up'] + data['store_step_up'] + data['other_step_up']
        out_of_pocket_total = data['tuition_out_of_pocket'] + data['fee_out_of_pocket'] + data['store_out_of_pocket'] + data['other_out_of_pocket']
        grand_total = step_up_total + out_of_pocket_total
        
        result.append({
            'month': month_key,
            'tuition_step_up': round(data['tuition_step_up'], 2),
            'tuition_out_of_pocket': round(data['tuition_out_of_pocket'], 2),
            'tuition_total': round(tuition_total, 2),
            'fee_step_up': round(data['fee_step_up'], 2),
            'fee_out_of_pocket': round(data['fee_out_of_pocket'], 2),
            'fee_total': round(fee_total, 2),
            'store_step_up': round(data['store_step_up'], 2),
            'store_out_of_pocket': round(data['store_out_of_pocket'], 2),
            'store_total': round(store_total, 2),
            'other_step_up': round(data['other_step_up'], 2),
            'other_out_of_pocket': round(data['other_out_of_pocket'], 2),
            'other_total': round(other_total, 2),
            'step_up_total': round(step_up_total, 2),
            'out_of_pocket_total': round(out_of_pocket_total, 2),
            'grand_total': round(grand_total, 2)
        })
    
    if month and result:
        return result[0]
    return result

@app.get("/api/revenue/series")
async def get_revenue_series(start: Optional[str] = None, end: Optional[str] = None):
    """Get revenue time series for charts (start and end in YYYY-MM format)"""
    monthly_revenue = await get_monthly_revenue()
    
    if start:
        monthly_revenue = [m for m in monthly_revenue if m['month'] >= start]
    if end:
        monthly_revenue = [m for m in monthly_revenue if m['month'] <= end]
    
    return monthly_revenue

@app.get("/api/families/{family_id}/tuition-history")
async def get_family_tuition_history(family_id: str):
    """Get detailed tuition history for a family with month-by-month breakdown"""
    from collections import defaultdict
    
    family = next((f for f in families_db if f.family_id == family_id), None)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    family_records = [b for b in billing_records_db if b.family_id == family_id]
    
    monthly_data = defaultdict(lambda: {
        'charges': [],
        'payments': [],
        'tuition_charge': 0.0,
        'step_up_paid': 0.0,
        'out_of_pocket_paid': 0.0
    })
    
    for record in family_records:
        if not record.period_month:
            continue
            
        month_key = record.period_month
        
        if record.type == "Charge" and record.category == BillingCategory.TUITION:
            monthly_data[month_key]['tuition_charge'] += record.amount
            monthly_data[month_key]['charges'].append({
                'billing_record_id': record.billing_record_id,
                'date': record.date.isoformat(),
                'description': record.description,
                'amount': record.amount,
                'category': record.category.value if record.category else None,
                'student_id': record.student_id
            })
        elif record.type == "Payment":
            amount = abs(record.amount)
            if record.source == PaymentSource.STEP_UP:
                monthly_data[month_key]['step_up_paid'] += amount
            else:
                monthly_data[month_key]['out_of_pocket_paid'] += amount
            
            monthly_data[month_key]['payments'].append({
                'billing_record_id': record.billing_record_id,
                'date': record.date.isoformat(),
                'description': record.description,
                'amount': record.amount,
                'source': record.source.value if record.source else None,
                'category': record.category.value if record.category else None,
                'student_id': record.student_id
            })
    
    result = []
    running_balance = 0.0
    
    for month_key in sorted(monthly_data.keys()):
        data = monthly_data[month_key]
        tuition_charge = data['tuition_charge']
        step_up_paid = data['step_up_paid']
        out_of_pocket_paid = data['out_of_pocket_paid']
        total_paid = step_up_paid + out_of_pocket_paid
        
        running_balance += tuition_charge - total_paid
        
        result.append({
            'month': month_key,
            'tuition_charge': round(tuition_charge, 2),
            'step_up_paid': round(step_up_paid, 2),
            'out_of_pocket_paid': round(out_of_pocket_paid, 2),
            'total_paid': round(total_paid, 2),
            'remaining_balance': round(running_balance, 2),
            'charges': data['charges'],
            'payments': data['payments']
        })
    
    return {
        'family_id': family_id,
        'family_name': family.family_name,
        'current_balance': family.current_balance,
        'monthly_tuition_amount': family.monthly_tuition_amount,
        'history': result
    }

@app.get("/api/invoices")
async def get_invoices(campus_id: Optional[str] = None, family_id: Optional[str] = None, status: Optional[str] = None):
    """Get all invoices with optional filters"""
    result = invoices_db
    
    if campus_id:
        result = [i for i in result if i.campus_id == campus_id]
    if family_id:
        result = [i for i in result if i.family_id == family_id]
    if status:
        result = [i for i in result if i.status.value == status]
    
    return sorted(result, key=lambda x: x.invoice_date, reverse=True)

@app.get("/api/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    """Get a specific invoice with line items"""
    invoice = next((i for i in invoices_db if i.invoice_id == invoice_id), None)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    line_items = [li for li in invoice_line_items_db if li.invoice_id == invoice_id]
    
    return {
        **invoice.dict(),
        'line_items': line_items
    }

@app.post("/api/invoices")
async def create_invoice(invoice: Invoice):
    """Create a new invoice"""
    invoices_db.append(invoice)
    db_utils.save_invoice(invoice)
    return invoice

@app.post("/api/invoices/generate-monthly")
async def generate_monthly_invoices(month: str, campus_id: Optional[str] = None):
    """Generate monthly invoices for all families (or specific campus)"""
    from datetime import datetime
    
    try:
        invoice_date = datetime.strptime(month, "%Y-%m").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    due_date = invoice_date.replace(day=15)
    families = families_db
    
    if campus_id:
        student_ids = [s.student_id for s in students_db if s.campus_id == campus_id]
        families = [f for f in families if any(s.student_id in student_ids for s in students_db if s.family_id == f.family_id)]
    
    generated_invoices = []
    for family in families:
        campus = next(c for c in campuses_db if any(s.campus_id == c.campus_id for s in students_db if s.family_id == family.family_id))
        family_students = [s for s in students_db if s.family_id == family.family_id]
        
        inv_uid = uuid.uuid4().hex[:8]
        invoice_id = f"inv_{inv_uid}"
        invoice_number = f"INV-{invoice_date.year}-{invoice_date.month:02d}-{inv_uid}"
        
        subtotal = 0.0
        line_items = []
        
        for student in family_students:
            monthly_tuition = family.monthly_tuition_amount / len(family_students)
            line_item = InvoiceLineItem(
                line_item_id=f"line_{uuid.uuid4().hex[:8]}",
                invoice_id=invoice_id,
                description=f"Monthly Tuition - {student.first_name} {student.last_name}",
                category=BillingCategory.TUITION,
                student_id=student.student_id,
                quantity=1,
                unit_price=monthly_tuition,
                total=monthly_tuition,
                funding_source=student.funding_source
            )
            line_items.append(line_item)
            subtotal += monthly_tuition
        
        tax = 0.0
        total = subtotal + tax
        
        invoice = Invoice(
            invoice_id=invoice_id,
            campus_id=campus.campus_id,
            family_id=family.family_id,
            invoice_number=invoice_number,
            invoice_date=invoice_date,
            due_date=due_date,
            status=InvoiceStatus.DRAFT,
            subtotal=subtotal,
            tax=tax,
            total=total,
            amount_paid=0.0,
            balance=total,
            notes=None,
            created_date=datetime.now(),
            last_updated=datetime.now()
        )
        
        invoices_db.append(invoice)
        db_utils.save_invoice(invoice)
        for li in line_items:
            db_utils.save_invoice_line_item(li)
        invoice_line_items_db.extend(line_items)
        generated_invoices.append(invoice)
    
    return {
        'count': len(generated_invoices),
        'invoices': generated_invoices
    }

@app.get("/api/payment-plans")
async def get_payment_plans(campus_id: Optional[str] = None, family_id: Optional[str] = None, status: Optional[str] = None):
    """Get all payment plans with optional filters"""
    result = payment_plans_db
    
    if campus_id:
        result = [p for p in result if p.campus_id == campus_id]
    if family_id:
        result = [p for p in result if p.family_id == family_id]
    if status:
        result = [p for p in result if p.status.value == status]
    
    return sorted(result, key=lambda x: x.created_date, reverse=True)

@app.get("/api/payment-plans/{payment_plan_id}")
async def get_payment_plan(payment_plan_id: str):
    """Get a specific payment plan with schedules"""
    plan = next((p for p in payment_plans_db if p.payment_plan_id == payment_plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Payment plan not found")
    
    schedules = [s for s in payment_schedules_db if s.payment_plan_id == payment_plan_id]
    
    return {
        **plan.dict(),
        'schedules': sorted(schedules, key=lambda x: x.installment_number)
    }

@app.post("/api/payment-plans")
async def create_payment_plan(plan: PaymentPlan):
    """Create a new payment plan"""
    payment_plans_db.append(plan)
    db_utils.save_payment_plan(plan)
    return plan

@app.put("/api/payment-plans/{payment_plan_id}")
async def update_payment_plan(payment_plan_id: str, plan: PaymentPlan):
    """Update an existing payment plan"""
    existing = next((p for p in payment_plans_db if p.payment_plan_id == payment_plan_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Payment plan not found")
    
    payment_plans_db.remove(existing)
    payment_plans_db.append(plan)
    db_utils.save_payment_plan(plan)
    return plan

@app.get("/api/reports/ar-aging")
async def get_ar_aging_report(campus_id: Optional[str] = None):
    """Get AR Aging Report (0-30, 31-60, 61-90, 90+ days overdue)"""
    from datetime import date, timedelta
    
    today = date.today()
    overdue_invoices = [i for i in invoices_db if i.balance > 0 and i.due_date < today]
    
    if campus_id:
        overdue_invoices = [i for i in overdue_invoices if i.campus_id == campus_id]
    
    aging_buckets = {
        '0-30': [],
        '31-60': [],
        '61-90': [],
        '90+': []
    }
    
    for invoice in overdue_invoices:
        days_overdue = (today - invoice.due_date).days
        family = next((f for f in families_db if f.family_id == invoice.family_id), None)
        
        invoice_data = {
            'invoice_id': invoice.invoice_id,
            'invoice_number': invoice.invoice_number,
            'family_id': invoice.family_id,
            'family_name': family.family_name if family else 'Unknown',
            'invoice_date': invoice.invoice_date.isoformat(),
            'due_date': invoice.due_date.isoformat(),
            'days_overdue': days_overdue,
            'total': invoice.total,
            'amount_paid': invoice.amount_paid,
            'balance': invoice.balance
        }
        
        if days_overdue <= 30:
            aging_buckets['0-30'].append(invoice_data)
        elif days_overdue <= 60:
            aging_buckets['31-60'].append(invoice_data)
        elif days_overdue <= 90:
            aging_buckets['61-90'].append(invoice_data)
        else:
            aging_buckets['90+'].append(invoice_data)
    
    summary = {
        '0-30': {
            'count': len(aging_buckets['0-30']),
            'total': sum(i['balance'] for i in aging_buckets['0-30'])
        },
        '31-60': {
            'count': len(aging_buckets['31-60']),
            'total': sum(i['balance'] for i in aging_buckets['31-60'])
        },
        '61-90': {
            'count': len(aging_buckets['61-90']),
            'total': sum(i['balance'] for i in aging_buckets['61-90'])
        },
        '90+': {
            'count': len(aging_buckets['90+']),
            'total': sum(i['balance'] for i in aging_buckets['90+'])
        }
    }
    
    return {
        'summary': summary,
        'details': aging_buckets
    }

@app.get("/api/families/{family_id}/statement")
async def get_family_statement(family_id: str, format: str = "json"):
    """Get family statement (downloadable as JSON or CSV)"""
    family = next((f for f in families_db if f.family_id == family_id), None)
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    family_invoices = [i for i in invoices_db if i.family_id == family_id]
    family_students = [s for s in students_db if s.family_id == family_id]
    
    statement_data = {
        'family_id': family_id,
        'family_name': family.family_name,
        'statement_date': date.today().isoformat(),
        'current_balance': family.current_balance,
        'monthly_tuition_amount': family.monthly_tuition_amount,
        'billing_status': family.billing_status.value,
        'students': [
            {
                'student_id': s.student_id,
                'name': f"{s.first_name} {s.last_name}",
                'grade': s.grade,
                'funding_source': s.funding_source.value if s.funding_source else None
            }
            for s in family_students
        ],
        'invoices': [
            {
                'invoice_number': i.invoice_number,
                'invoice_date': i.invoice_date.isoformat(),
                'due_date': i.due_date.isoformat(),
                'status': i.status.value,
                'total': i.total,
                'amount_paid': i.amount_paid,
                'balance': i.balance
            }
            for i in sorted(family_invoices, key=lambda x: x.invoice_date, reverse=True)
        ],
        'total_invoiced': sum(i.total for i in family_invoices),
        'total_paid': sum(i.amount_paid for i in family_invoices),
        'total_outstanding': sum(i.balance for i in family_invoices)
    }
    
    if format == "csv":
        from fastapi.responses import StreamingResponse
        import io
        import csv
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Family Statement'])
        writer.writerow(['Family Name:', family.family_name])
        writer.writerow(['Statement Date:', date.today().isoformat()])
        writer.writerow(['Current Balance:', f"${family.current_balance:.2f}"])
        writer.writerow([])
        writer.writerow(['Invoice Number', 'Invoice Date', 'Due Date', 'Status', 'Total', 'Paid', 'Balance'])
        
        for invoice in statement_data['invoices']:
            writer.writerow([
                invoice['invoice_number'],
                invoice['invoice_date'],
                invoice['due_date'],
                invoice['status'],
                f"${invoice['total']:.2f}",
                f"${invoice['amount_paid']:.2f}",
                f"${invoice['balance']:.2f}"
            ])
        
        writer.writerow([])
        writer.writerow(['Total Invoiced:', f"${statement_data['total_invoiced']:.2f}"])
        writer.writerow(['Total Paid:', f"${statement_data['total_paid']:.2f}"])
        writer.writerow(['Total Outstanding:', f"${statement_data['total_outstanding']:.2f}"])
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=family_statement_{family_id}.csv"}
        )
    
    return statement_data

@app.get("/api/reports/quickbooks-export")
async def get_quickbooks_export(start_date: str, end_date: str, campus_id: Optional[str] = None):
    """Export transactions for QuickBooks (CSV format)"""
    from fastapi.responses import StreamingResponse
    from datetime import datetime
    import io
    import csv
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    invoices = [i for i in invoices_db if start <= i.invoice_date <= end]
    
    if campus_id:
        invoices = [i for i in invoices if i.campus_id == campus_id]
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Date', 'Transaction Type', 'Invoice Number', 'Customer', 'Account', 'Amount', 'Description', 'Campus'])
    
    for invoice in sorted(invoices, key=lambda x: x.invoice_date):
        family = next((f for f in families_db if f.family_id == invoice.family_id), None)
        campus = next((c for c in campuses_db if c.campus_id == invoice.campus_id), None)
        line_items = [li for li in invoice_line_items_db if li.invoice_id == invoice.invoice_id]
        
        for line_item in line_items:
            account = f"Revenue - {line_item.category.value}" if line_item.category else "Revenue - Other"
            writer.writerow([
                invoice.invoice_date.isoformat(),
                'Invoice',
                invoice.invoice_number,
                family.family_name if family else 'Unknown',
                account,
                f"{line_item.total:.2f}",
                line_item.description,
                campus.name if campus else 'Unknown'
            ])
        
        if invoice.amount_paid > 0:
            writer.writerow([
                invoice.invoice_date.isoformat(),
                'Payment',
                invoice.invoice_number,
                family.family_name if family else 'Unknown',
                'Accounts Receivable',
                f"-{invoice.amount_paid:.2f}",
                f"Payment for {invoice.invoice_number}",
                campus.name if campus else 'Unknown'
            ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=quickbooks_export_{start_date}_{end_date}.csv"}
    )

@app.get("/api/reports/step-up-reconciliation")
async def get_step_up_reconciliation(month: str, campus_id: Optional[str] = None):
    """Get Step-Up reconciliation report (expected vs received, variance tracking)"""
    from datetime import datetime
    from collections import defaultdict
    
    try:
        report_date = datetime.strptime(month, "%Y-%m").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    invoices = [i for i in invoices_db if i.invoice_date.year == report_date.year and i.invoice_date.month == report_date.month]
    
    if campus_id:
        invoices = [i for i in invoices if i.campus_id == campus_id]
    
    step_up_data = defaultdict(lambda: {
        'expected': 0.0,
        'received': 0.0,
        'variance': 0.0,
        'students': []
    })
    
    for invoice in invoices:
        line_items = [li for li in invoice_line_items_db if li.invoice_id == invoice.invoice_id]
        
        for line_item in line_items:
            if line_item.funding_source == FundingSource.STEP_UP and line_item.student_id:
                student = next((s for s in students_db if s.student_id == line_item.student_id), None)
                if not student:
                    continue
                
                expected_amount = line_item.total * (student.step_up_percentage / 100.0)
                
                received_amount = 0.0
                if invoice.status == InvoiceStatus.PAID:
                    received_amount = expected_amount
                elif invoice.amount_paid > 0:
                    received_amount = (invoice.amount_paid / invoice.total) * expected_amount
                
                variance = received_amount - expected_amount
                
                student_key = student.student_id
                step_up_data[student_key]['expected'] += expected_amount
                step_up_data[student_key]['received'] += received_amount
                step_up_data[student_key]['variance'] += variance
                
                if not step_up_data[student_key]['students']:
                    step_up_data[student_key]['students'] = {
                        'student_id': student.student_id,
                        'name': f"{student.first_name} {student.last_name}",
                        'grade': student.grade,
                        'step_up_percentage': student.step_up_percentage
                    }
    
    reconciliation_details = []
    total_expected = 0.0
    total_received = 0.0
    total_variance = 0.0
    
    for student_id, data in step_up_data.items():
        reconciliation_details.append({
            **data['students'],
            'expected': round(data['expected'], 2),
            'received': round(data['received'], 2),
            'variance': round(data['variance'], 2),
            'variance_percentage': round((data['variance'] / data['expected'] * 100) if data['expected'] > 0 else 0, 2)
        })
        
        total_expected += data['expected']
        total_received += data['received']
        total_variance += data['variance']
    
    return {
        'month': month,
        'summary': {
            'total_expected': round(total_expected, 2),
            'total_received': round(total_received, 2),
            'total_variance': round(total_variance, 2),
            'variance_percentage': round((total_variance / total_expected * 100) if total_expected > 0 else 0, 2)
        },
        'details': sorted(reconciliation_details, key=lambda x: abs(x['variance']), reverse=True)
    }

@app.get("/api/admissions/leads")
async def get_leads(campus_id: Optional[str] = None, stage: Optional[str] = None):
    """Get all leads with optional filtering"""
    filtered_leads = leads_db
    
    if campus_id:
        filtered_leads = [l for l in filtered_leads if l.campus_id == campus_id]
    
    if stage:
        filtered_leads = [l for l in filtered_leads if l.stage.value == stage]
    
    return filtered_leads

@app.get("/api/admissions/leads/{lead_id}")
async def get_lead(lead_id: str):
    """Get a specific lead by ID"""
    lead = next((l for l in leads_db if l.lead_id == lead_id), None)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@app.post("/api/admissions/leads")
async def create_lead(lead: Lead):
    """Create a new lead"""
    if any(l.lead_id == lead.lead_id for l in leads_db):
        raise HTTPException(status_code=400, detail="Lead ID already exists")
    leads_db.append(lead)
    db_utils.save_lead(lead)
    return lead

@app.put("/api/admissions/leads/{lead_id}")
async def update_lead(lead_id: str, lead: Lead):
    """Update an existing lead"""
    index = next((i for i, l in enumerate(leads_db) if l.lead_id == lead_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    leads_db[index] = lead
    db_utils.save_lead(lead)
    return lead

@app.get("/api/admissions/capacity")
async def get_campus_capacity(campus_id: Optional[str] = None):
    """Get campus capacity information"""
    filtered_capacity = campus_capacity_db
    
    if campus_id:
        filtered_capacity = [c for c in filtered_capacity if c.campus_id == campus_id]
    
    return filtered_capacity

@app.get("/api/admissions/pipeline-summary")
async def get_pipeline_summary(campus_id: Optional[str] = None):
    """Get admissions pipeline summary with stage counts"""
    filtered_leads = leads_db if not campus_id else [l for l in leads_db if l.campus_id == campus_id]
    
    stage_counts = {}
    for stage in LeadStage:
        stage_counts[stage.value] = len([l for l in filtered_leads if l.stage == stage])
    
    return {
        'total_leads': len(filtered_leads),
        'stage_counts': stage_counts,
        'conversion_rate': round((stage_counts.get('Enrolled', 0) / len(filtered_leads) * 100) if len(filtered_leads) > 0 else 0, 2)
    }

@app.get("/api/communications/templates")
async def get_message_templates():
    """Get all message templates"""
    return message_templates_db

@app.get("/api/communications/templates/{template_id}")
async def get_message_template(template_id: str):
    """Get a specific message template"""
    template = next((t for t in message_templates_db if t.template_id == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.post("/api/communications/templates")
async def create_message_template(template: MessageTemplate):
    """Create a new message template"""
    if any(t.template_id == template.template_id for t in message_templates_db):
        raise HTTPException(status_code=400, detail="Template ID already exists")
    message_templates_db.append(template)
    db_utils.save_template(template)
    return template

@app.put("/api/communications/templates/{template_id}")
async def update_message_template(template_id: str, template: MessageTemplate):
    """Update an existing message template"""
    index = next((i for i, t in enumerate(message_templates_db) if t.template_id == template_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Template not found")
    message_templates_db[index] = template
    db_utils.save_template(template)
    return template

@app.get("/api/communications/broadcasts")
async def get_broadcast_messages(campus_id: Optional[str] = None, status: Optional[str] = None):
    """Get all broadcast messages with optional filtering"""
    filtered_broadcasts = broadcast_messages_db
    
    if campus_id:
        filtered_broadcasts = [b for b in filtered_broadcasts if b.campus_id == campus_id or b.campus_id is None]
    
    if status:
        filtered_broadcasts = [b for b in filtered_broadcasts if b.status.value == status]
    
    return sorted(filtered_broadcasts, key=lambda x: x.created_date, reverse=True)

@app.get("/api/communications/broadcasts/{broadcast_id}")
async def get_broadcast_message(broadcast_id: str):
    """Get a specific broadcast message"""
    broadcast = next((b for b in broadcast_messages_db if b.broadcast_id == broadcast_id), None)
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    return broadcast

@app.post("/api/communications/broadcasts")
async def create_broadcast_message(broadcast: BroadcastMessage):
    """Create a new broadcast message"""
    if any(b.broadcast_id == broadcast.broadcast_id for b in broadcast_messages_db):
        raise HTTPException(status_code=400, detail="Broadcast ID already exists")
    broadcast_messages_db.append(broadcast)
    db_utils.save_broadcast(broadcast)
    return broadcast

@app.put("/api/communications/broadcasts/{broadcast_id}")
async def update_broadcast_message(broadcast_id: str, broadcast: BroadcastMessage):
    """Update an existing broadcast message"""
    index = next((i for i, b in enumerate(broadcast_messages_db) if b.broadcast_id == broadcast_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    broadcast_messages_db[index] = broadcast
    db_utils.save_broadcast(broadcast)
    return broadcast

@app.get("/api/communications/alerts")
async def get_automated_alerts(student_id: Optional[str] = None, family_id: Optional[str] = None):
    """Get automated alerts with optional filtering"""
    filtered_alerts = automated_alerts_db
    
    if student_id:
        filtered_alerts = [a for a in filtered_alerts if a.student_id == student_id]
    
    if family_id:
        filtered_alerts = [a for a in filtered_alerts if a.family_id == family_id]
    
    return sorted(filtered_alerts, key=lambda x: x.triggered_date, reverse=True)

@app.get("/api/academics/standards")
async def get_academic_standards(subject: Optional[str] = None, grade: Optional[str] = None):
    """Get academic standards with optional filtering"""
    filtered_standards = academic_standards_db
    
    if subject:
        filtered_standards = [s for s in filtered_standards if s.subject == subject]
    
    if grade:
        filtered_standards = [s for s in filtered_standards if s.grade == grade]
    
    return filtered_standards

@app.get("/api/academics/standards/{standard_id}")
async def get_academic_standard(standard_id: str):
    """Get a specific academic standard"""
    standard = next((s for s in academic_standards_db if s.standard_id == standard_id), None)
    if not standard:
        raise HTTPException(status_code=404, detail="Standard not found")
    return standard

@app.get("/api/academics/assessments")
async def get_standard_assessments(student_id: Optional[str] = None, standard_id: Optional[str] = None):
    """Get standard assessments with optional filtering"""
    filtered_assessments = standard_assessments_db
    
    if student_id:
        filtered_assessments = [a for a in filtered_assessments if a.student_id == student_id]
    
    if standard_id:
        filtered_assessments = [a for a in filtered_assessments if a.standard_id == standard_id]
    
    return sorted(filtered_assessments, key=lambda x: x.assessment_date, reverse=True)

@app.post("/api/academics/assessments")
async def create_standard_assessment(assessment: StandardAssessment):
    """Create a new standard assessment"""
    if any(a.assessment_id == assessment.assessment_id for a in standard_assessments_db):
        raise HTTPException(status_code=400, detail="Assessment ID already exists")
    standard_assessments_db.append(assessment)
    db_utils.save_assessment(assessment)
    return assessment

@app.put("/api/academics/assessments/{assessment_id}")
async def update_standard_assessment(assessment_id: str, assessment: StandardAssessment):
    """Update an existing standard assessment"""
    index = next((i for i, a in enumerate(standard_assessments_db) if a.assessment_id == assessment_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    standard_assessments_db[index] = assessment
    db_utils.save_assessment(assessment)
    return assessment

@app.get("/api/academics/progress-reports")
async def get_progress_reports(student_id: Optional[str] = None):
    """Get progress reports with optional filtering"""
    filtered_reports = progress_reports_db
    
    if student_id:
        filtered_reports = [r for r in filtered_reports if r.student_id == student_id]
    
    return filtered_reports

@app.get("/api/academics/progress-reports/{report_id}")
async def get_progress_report(report_id: str):
    """Get a specific progress report"""
    report = next((r for r in progress_reports_db if r.report_id == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Progress report not found")
    return report

@app.get("/api/academics/student-progress/{student_id}")
async def get_student_progress(student_id: str):
    """Get comprehensive progress data for a student"""
    student = next((s for s in students_db if s.student_id == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    assessments = [a for a in standard_assessments_db if a.student_id == student_id]
    report = next((r for r in progress_reports_db if r.student_id == student_id), None)
    
    standards_by_subject = {}
    for assessment in assessments:
        standard = next((s for s in academic_standards_db if s.standard_id == assessment.standard_id), None)
        if standard:
            if standard.subject not in standards_by_subject:
                standards_by_subject[standard.subject] = []
            standards_by_subject[standard.subject].append({
                'standard': standard,
                'assessment': assessment
            })
    
    return {
        'student': student,
        'progress_report': report,
        'assessments_by_subject': standards_by_subject,
        'total_assessments': len(assessments)
    }

@app.get("/api/iep-504-plans")
async def get_iep_504_plans(campus_id: Optional[str] = None):
    """Get all IEP/504 plans, optionally filtered by campus"""
    plans = iep_504_plans_db
    if campus_id:
        plans = [p for p in plans if p.campus_id == campus_id]
    
    # Include student names in the response
    plans_with_students = []
    for plan in plans:
        student = next((s for s in students_db if s.student_id == plan.student_id), None)
        plan_dict = plan.model_dump() if hasattr(plan, 'model_dump') else plan.__dict__.copy()
        if student:
            plan_dict['student_name'] = f"{student.first_name} {student.last_name}"
            plan_dict['student_grade'] = student.grade
        else:
            plan_dict['student_name'] = f"Student {plan.student_id}"
            plan_dict['student_grade'] = "N/A"
        plans_with_students.append(plan_dict)
    
    return plans_with_students

@app.get("/api/iep-504-plans/{plan_id}")
async def get_iep_504_plan(plan_id: str):
    """Get a specific IEP/504 plan with accommodations and goals"""
    plan = next((p for p in iep_504_plans_db if p.plan_id == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    accommodations = [a for a in accommodations_db if a.plan_id == plan_id]
    goals = [g for g in iep_goals_db if g.plan_id == plan_id]
    student = next((s for s in students_db if s.student_id == plan.student_id), None)
    
    return {
        'plan': plan,
        'student': student,
        'accommodations': accommodations,
        'goals': goals
    }

@app.get("/api/iep-504-plans/student/{student_id}")
async def get_student_iep_504_plans(student_id: str):
    """Get all IEP/504 plans for a specific student"""
    plans = [p for p in iep_504_plans_db if p.student_id == student_id]
    return plans

@app.get("/api/accommodations")
async def get_accommodations(plan_id: Optional[str] = None):
    """Get all accommodations, optionally filtered by plan"""
    accommodations = accommodations_db
    if plan_id:
        accommodations = [a for a in accommodations if a.plan_id == plan_id]
    return accommodations

@app.get("/api/iep-goals")
async def get_iep_goals(plan_id: Optional[str] = None):
    """Get all IEP goals, optionally filtered by plan"""
    goals = iep_goals_db
    if plan_id:
        goals = [g for g in goals if g.plan_id == plan_id]
    return goals

@app.get("/api/interventions")
async def get_interventions(campus_id: Optional[str] = None, student_id: Optional[str] = None, tier: Optional[str] = None):
    """Get all intervention plans with optional filters"""
    interventions = intervention_plans_db
    if campus_id:
        interventions = [i for i in interventions if i.campus_id == campus_id]
    if student_id:
        interventions = [i for i in interventions if i.student_id == student_id]
    if tier:
        interventions = [i for i in interventions if i.tier.value == tier]
    return interventions

@app.get("/api/interventions/{intervention_id}")
async def get_intervention(intervention_id: str):
    """Get a specific intervention plan with progress data"""
    intervention = next((i for i in intervention_plans_db if i.intervention_id == intervention_id), None)
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")
    
    progress = [p for p in intervention_progress_db if p.intervention_id == intervention_id]
    student = next((s for s in students_db if s.student_id == intervention.student_id), None)
    
    return {
        'intervention': intervention,
        'student': student,
        'progress': progress
    }

@app.get("/api/interventions/student/{student_id}")
async def get_student_interventions(student_id: str):
    """Get all interventions for a specific student"""
    interventions = [i for i in intervention_plans_db if i.student_id == student_id]
    return interventions

@app.get("/api/intervention-progress/{intervention_id}")
async def get_intervention_progress(intervention_id: str):
    """Get all progress data for an intervention"""
    progress = [p for p in intervention_progress_db if p.intervention_id == intervention_id]
    return progress

@app.get("/api/analytics/at-risk-assessments")
async def get_at_risk_assessments(campus_id: Optional[str] = None, risk_level: Optional[str] = None):
    """Get all at-risk assessments with optional filters"""
    assessments = at_risk_assessments_db
    if campus_id:
        assessments = [a for a in assessments if a.campus_id == campus_id]
    if risk_level:
        assessments = [a for a in assessments if a.overall_risk_level.value == risk_level]
    
    # Include student names in the response
    assessments_with_students = []
    for assessment in assessments:
        student = next((s for s in students_db if s.student_id == assessment.student_id), None)
        assessment_dict = assessment.model_dump() if hasattr(assessment, 'model_dump') else assessment.__dict__.copy()
        if student:
            assessment_dict['student_name'] = f"{student.first_name} {student.last_name}"
            assessment_dict['student_grade'] = student.grade
        else:
            assessment_dict['student_name'] = f"Student {assessment.student_id}"
            assessment_dict['student_grade'] = "N/A"
        assessments_with_students.append(assessment_dict)
    
    return assessments_with_students

@app.get("/api/analytics/at-risk-assessments/{assessment_id}")
async def get_at_risk_assessment(assessment_id: str):
    """Get a specific at-risk assessment"""
    assessment = next((a for a in at_risk_assessments_db if a.assessment_id == assessment_id), None)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    student = next((s for s in students_db if s.student_id == assessment.student_id), None)
    return {
        'assessment': assessment,
        'student': student
    }

@app.get("/api/analytics/at-risk-assessments/student/{student_id}")
async def get_student_at_risk_assessment(student_id: str):
    """Get the most recent at-risk assessment for a student"""
    assessments = [a for a in at_risk_assessments_db if a.student_id == student_id]
    if not assessments:
        return None
    return max(assessments, key=lambda a: a.assessment_date)

@app.get("/api/analytics/retention-predictions")
async def get_retention_predictions(campus_id: Optional[str] = None, risk_level: Optional[str] = None):
    """Get all retention predictions with optional filters"""
    predictions = retention_predictions_db
    if campus_id:
        predictions = [p for p in predictions if p.campus_id == campus_id]
    if risk_level:
        predictions = [p for p in predictions if p.risk_level.value == risk_level]
    
    # Include student names in the response
    predictions_with_students = []
    for prediction in predictions:
        student = next((s for s in students_db if s.student_id == prediction.student_id), None)
        prediction_dict = prediction.model_dump() if hasattr(prediction, 'model_dump') else prediction.__dict__.copy()
        if student:
            prediction_dict['student_name'] = f"{student.first_name} {student.last_name}"
            prediction_dict['student_grade'] = student.grade
        else:
            prediction_dict['student_name'] = f"Student {prediction.student_id}"
            prediction_dict['student_grade'] = "N/A"
        predictions_with_students.append(prediction_dict)
    
    return predictions_with_students

@app.get("/api/analytics/retention-predictions/{prediction_id}")
async def get_retention_prediction(prediction_id: str):
    """Get a specific retention prediction"""
    prediction = next((p for p in retention_predictions_db if p.prediction_id == prediction_id), None)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    student = next((s for s in students_db if s.student_id == prediction.student_id), None)
    return {
        'prediction': prediction,
        'student': student
    }

@app.get("/api/analytics/retention-predictions/student/{student_id}")
async def get_student_retention_prediction(student_id: str):
    """Get the most recent retention prediction for a student"""
    predictions = [p for p in retention_predictions_db if p.student_id == student_id]
    if not predictions:
        return None
    return max(predictions, key=lambda p: p.last_updated)

@app.get("/api/analytics/enrollment-forecasts")
async def get_enrollment_forecasts(campus_id: Optional[str] = None, school_year: Optional[str] = None):
    """Get all enrollment forecasts with optional filters"""
    forecasts = enrollment_forecasts_db
    if campus_id:
        forecasts = [f for f in forecasts if f.campus_id == campus_id]
    if school_year:
        forecasts = [f for f in forecasts if f.school_year == school_year]
    return forecasts

@app.get("/api/analytics/enrollment-forecasts/{forecast_id}")
async def get_enrollment_forecast(forecast_id: str):
    """Get a specific enrollment forecast"""
    forecast = next((f for f in enrollment_forecasts_db if f.forecast_id == forecast_id), None)
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return forecast

@app.get("/api/analytics/enrollment-forecasts/campus/{campus_id}")
async def get_campus_enrollment_forecasts(campus_id: str, school_year: Optional[str] = None):
    """Get all enrollment forecasts for a specific campus"""
    forecasts = [f for f in enrollment_forecasts_db if f.campus_id == campus_id]
    if school_year:
        forecasts = [f for f in forecasts if f.school_year == school_year]
    return forecasts

@app.get("/api/analytics/dashboard")
async def get_analytics_dashboard(campus_id: Optional[str] = None):
    """Get comprehensive analytics dashboard data"""
    at_risk = at_risk_assessments_db
    if campus_id:
        at_risk = [a for a in at_risk if a.campus_id == campus_id]
    
    critical_students = len([a for a in at_risk if a.overall_risk_level == RiskLevel.CRITICAL])
    high_risk_students = len([a for a in at_risk if a.overall_risk_level == RiskLevel.HIGH])
    medium_risk_students = len([a for a in at_risk if a.overall_risk_level == RiskLevel.MEDIUM])
    low_risk_students = len([a for a in at_risk if a.overall_risk_level == RiskLevel.LOW])
    
    retention = retention_predictions_db
    if campus_id:
        retention = [r for r in retention if r.campus_id == campus_id]
    
    avg_retention_prob = sum([r.retention_probability for r in retention]) / len(retention) if retention else 0
    
    interventions = intervention_plans_db
    if campus_id:
        interventions = [i for i in interventions if i.campus_id == campus_id]
    
    active_interventions = len([i for i in interventions if i.status == InterventionStatus.ACTIVE])
    
    iep_plans = iep_504_plans_db
    if campus_id:
        iep_plans = [p for p in iep_plans if p.campus_id == campus_id]
    
    active_iep_plans = len([p for p in iep_plans if p.status == PlanStatus.ACTIVE])
    
    return {
        'at_risk_summary': {
            'critical': critical_students,
            'high': high_risk_students,
            'medium': medium_risk_students,
            'low': low_risk_students,
            'total': len(at_risk)
        },
        'retention_summary': {
            'average_probability': round(avg_retention_prob, 2),
            'total_predictions': len(retention)
        },
        'intervention_summary': {
            'active': active_interventions,
            'total': len(interventions)
        },
        'iep_504_summary': {
            'active': active_iep_plans,
            'total': len(iep_plans)
        }
    }

@app.get("/api/assignments")
async def get_assignments(campus_id: Optional[str] = None, teacher_id: Optional[str] = None, room: Optional[str] = None):
    filtered = assignments_db
    if campus_id:
        filtered = [a for a in filtered if a.campus_id == campus_id]
    if teacher_id:
        filtered = [a for a in filtered if a.teacher_id == teacher_id]
    if room:
        filtered = [a for a in filtered if a.room.value == room]
    return filtered

@app.get("/api/assignments/{assignment_id}")
async def get_assignment(assignment_id: str):
    assignment = next((a for a in assignments_db if a.assignment_id == assignment_id), None)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@app.post("/api/assignments")
async def create_assignment(assignment: Assignment):
    assignments_db.append(assignment)
    db_utils.save_assignment(assignment)
    return assignment

@app.put("/api/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, assignment: Assignment):
    for i, a in enumerate(assignments_db):
        if a.assignment_id == assignment_id:
            assignments_db[i] = assignment
            db_utils.save_assignment(assignment)
            return assignment
    raise HTTPException(status_code=404, detail="Assignment not found")

@app.get("/api/grade-entries")
async def get_grade_entries(assignment_id: Optional[str] = None, student_id: Optional[str] = None, campus_id: Optional[str] = None):
    filtered = grade_entries_db
    if assignment_id:
        filtered = [g for g in filtered if g.assignment_id == assignment_id]
    if student_id:
        filtered = [g for g in filtered if g.student_id == student_id]
    if campus_id:
        filtered = [g for g in filtered if g.campus_id == campus_id]
    return filtered

@app.post("/api/grade-entries")
async def create_grade_entry(entry: GradeEntry):
    grade_entries_db.append(entry)
    db_utils.save_grade_entry(entry)
    return entry

@app.put("/api/grade-entries/{entry_id}")
async def update_grade_entry(entry_id: str, entry: GradeEntry):
    for i, g in enumerate(grade_entries_db):
        if g.entry_id == entry_id:
            grade_entries_db[i] = entry
            db_utils.save_grade_entry(entry)
            return entry
    raise HTTPException(status_code=404, detail="Grade entry not found")

@app.post("/api/grade-entries/bulk")
async def bulk_create_grade_entries(entries: List[GradeEntry]):
    grade_entries_db.extend(entries)
    for entry in entries:
        db_utils.save_grade_entry(entry)
    return {"created": len(entries), "entries": entries}

@app.get("/api/announcements")
async def get_announcements(campus_id: Optional[str] = None, status: Optional[str] = None, category: Optional[str] = None):
    filtered = announcements_db
    if campus_id:
        filtered = [a for a in filtered if a.campus_id == campus_id]
    if status:
        filtered = [a for a in filtered if a.status.value == status]
    if category:
        filtered = [a for a in filtered if a.category.value == category]
    filtered = sorted(filtered, key=lambda x: (not x.is_pinned, x.published_date or date.today()), reverse=True)
    return filtered

@app.get("/api/announcements/{announcement_id}")
async def get_announcement(announcement_id: str):
    announcement = next((a for a in announcements_db if a.announcement_id == announcement_id), None)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

@app.post("/api/announcements")
async def create_announcement(announcement: Announcement):
    announcements_db.append(announcement)
    db_utils.save_announcement(announcement)
    return announcement

@app.put("/api/announcements/{announcement_id}")
async def update_announcement(announcement_id: str, announcement: Announcement):
    for i, a in enumerate(announcements_db):
        if a.announcement_id == announcement_id:
            announcements_db[i] = announcement
            db_utils.save_announcement(announcement)
            return announcement
    raise HTTPException(status_code=404, detail="Announcement not found")

@app.post("/api/announcements/{announcement_id}/approve")
async def approve_announcement(announcement_id: str, approved_by: str):
    for i, a in enumerate(announcements_db):
        if a.announcement_id == announcement_id:
            announcements_db[i].status = AnnouncementStatus.PUBLISHED
            announcements_db[i].approved_by = approved_by
            announcements_db[i].approved_date = date.today()
            announcements_db[i].published_date = date.today()
            db_utils.save_announcement(announcements_db[i])
            return announcements_db[i]
    raise HTTPException(status_code=404, detail="Announcement not found")

@app.post("/api/announcements/{announcement_id}/read")
async def mark_announcement_read(announcement_id: str, user_id: str):
    read_record = AnnouncementRead(
        read_id=f"read_{uuid.uuid4().hex[:8]}",
        announcement_id=announcement_id,
        user_id=user_id,
        read_date=date.today()
    )
    announcement_reads_db.append(read_record)
    db_utils.save_announcement_read(read_record)
    return read_record

@app.get("/api/announcements/{announcement_id}/reads")
async def get_announcement_reads(announcement_id: str):
    return [r for r in announcement_reads_db if r.announcement_id == announcement_id]

@app.get("/api/event-workflows")
async def get_event_workflows(event_id: Optional[str] = None, family_id: Optional[str] = None, student_id: Optional[str] = None):
    filtered = event_workflows_db
    if event_id:
        filtered = [w for w in filtered if w.event_id == event_id]
    if family_id:
        filtered = [w for w in filtered if w.family_id == family_id]
    if student_id:
        filtered = [w for w in filtered if w.student_id == student_id]
    return filtered

@app.get("/api/event-workflows/{workflow_id}")
async def get_event_workflow(workflow_id: str):
    workflow = next((w for w in event_workflows_db if w.workflow_id == workflow_id), None)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@app.post("/api/event-workflows")
async def create_event_workflow(workflow: EventWorkflow):
    event_workflows_db.append(workflow)
    db_utils.save_workflow(workflow)
    return workflow

@app.put("/api/event-workflows/{workflow_id}")
async def update_event_workflow(workflow_id: str, workflow: EventWorkflow):
    for i, w in enumerate(event_workflows_db):
        if w.workflow_id == workflow_id:
            event_workflows_db[i] = workflow
            db_utils.save_workflow(workflow)
            return workflow
    raise HTTPException(status_code=404, detail="Workflow not found")

@app.post("/api/event-workflows/{workflow_id}/sign-permission-slip")
async def sign_permission_slip(workflow_id: str, signature_id: str):
    for i, w in enumerate(event_workflows_db):
        if w.workflow_id == workflow_id:
            event_workflows_db[i].permission_slip_signed = True
            event_workflows_db[i].permission_slip_signature_id = signature_id
            if event_workflows_db[i].status == WorkflowStatus.PENDING:
                event_workflows_db[i].status = WorkflowStatus.PERMISSION_SLIP_SIGNED
            db_utils.save_workflow(event_workflows_db[i])
            return event_workflows_db[i]
    raise HTTPException(status_code=404, detail="Workflow not found")

@app.post("/api/event-workflows/{workflow_id}/complete-payment")
async def complete_payment(workflow_id: str, order_id: str):
    for i, w in enumerate(event_workflows_db):
        if w.workflow_id == workflow_id:
            event_workflows_db[i].payment_complete = True
            event_workflows_db[i].payment_order_id = order_id
            event_workflows_db[i].status = WorkflowStatus.REGISTERED
            event_workflows_db[i].completed_date = date.today()
            db_utils.save_workflow(event_workflows_db[i])
            return event_workflows_db[i]
    raise HTTPException(status_code=404, detail="Workflow not found")

# Staff Management endpoints
@app.get("/api/staff")
async def get_staff(campus_id: str = None):
    """Get all staff members, optionally filtered by campus"""
    staff_list = []
    for s in staff_db:
        staff_dict = {
            'staff_id': s.staff_id,
            'first_name': s.first_name,
            'last_name': s.last_name,
            'role': s.role,
            'email': s.email,
            'assigned_rooms': s.assigned_rooms if hasattr(s, 'assigned_rooms') else [],
            'campus_id': s.campus_id if hasattr(s, 'campus_id') else None
        }
        if campus_id and staff_dict.get('campus_id') == campus_id:
            staff_list.append(staff_dict)
        elif not campus_id:
            staff_list.append(staff_dict)
    return staff_list

@app.post("/api/staff")
async def create_staff(staff_data: dict):
    """Create a new staff member"""
    new_staff = Staff(
        staff_id=staff_data['staff_id'],
        first_name=staff_data['first_name'],
        last_name=staff_data['last_name'],
        role=staff_data['role'],
        email=staff_data['email'],
        assigned_rooms=staff_data.get('assigned_rooms', []),
        campus_ids=staff_data.get('campus_ids', ['pace']),
        permissions=staff_data.get('permissions', 'standard')
    )
    staff_db.append(new_staff)
    db_utils.save_staff(new_staff)
    return {"status": "success", "staff_id": staff_data['staff_id']}

# Grade Assignment endpoints
@app.get("/api/grade-assignments")
async def get_grade_assignments(student_id: str, subject: str):
    """Get grade assignments for a student in a specific subject"""
    from datetime import datetime, timedelta
    
    # Generate demo assignments
    assignments = []
    assignment_types = ['Test', 'Project', 'Homework', 'Quiz', 'Classwork']
    grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
    
    for i in range(15):
        assignment_type = assignment_types[i % len(assignment_types)]
        grade = grades[min(i % len(grades), len(grades)-1)]
        points_possible = 100 if assignment_type in ['Test', 'Project'] else 50 if assignment_type == 'Quiz' else 20
        points_earned = int(points_possible * (0.95 - (i * 0.03)))
        
        assignments.append({
            'assignment_id': f'assign_{student_id}_{subject}_{i}',
            'student_id': student_id,
            'subject': subject,
            'assignment_type': assignment_type,
            'title': f'{subject} {assignment_type} #{i+1}',
            'grade': grade,
            'points_earned': points_earned,
            'points_possible': points_possible,
            'date_assigned': (datetime.now() - timedelta(days=60-i*4)).isoformat(),
            'date_submitted': (datetime.now() - timedelta(days=58-i*4)).isoformat()
        })
    
    return assignments

# Payment Method endpoints
payment_methods_db = []

@app.get("/api/payment-methods")
async def get_payment_methods(family_id: str):
    """Get payment methods for a family"""
    return [pm for pm in payment_methods_db if pm.get('family_id') == family_id]

@app.post("/api/payment-methods")
async def create_payment_method(payment_data: dict):
    """Create a new payment method"""
    payment_methods_db.append(payment_data)
    # payment_methods stored in-memory only for now
    return {"status": "success", "payment_method_id": payment_data['payment_method_id']}

@app.put("/api/payment-methods/{payment_method_id}/set-default")
async def set_default_payment_method(payment_method_id: str):
    """Set a payment method as default"""
    for pm in payment_methods_db:
        if pm['payment_method_id'] == payment_method_id:
            pm['is_default'] = True
        else:
            pm['is_default'] = False
    return {"status": "success"}

@app.delete("/api/payment-methods/{payment_method_id}")
async def delete_payment_method(payment_method_id: str):
    """Delete a payment method"""
    global payment_methods_db
    payment_methods_db = [pm for pm in payment_methods_db if pm['payment_method_id'] != payment_method_id]
    return {"status": "success"}

# ==================== STEP UP FOR STUDENTS (SUFS) SCHOLARSHIP ENDPOINTS ====================

@app.get("/api/sufs/scholarships")
async def get_sufs_scholarships(
    campus_id: Optional[str] = None,
    student_id: Optional[str] = None,
    family_id: Optional[str] = None,
    scholarship_type: Optional[SUFSScholarshipType] = None,
    status: Optional[str] = None
):
    """Get all SUFS scholarships with optional filters"""
    filtered = sufs_scholarships_db
    if campus_id:
        filtered = [s for s in filtered if s.campus_id == campus_id]
    if student_id:
        filtered = [s for s in filtered if s.student_id == student_id]
    if family_id:
        filtered = [s for s in filtered if s.family_id == family_id]
    if scholarship_type:
        filtered = [s for s in filtered if s.scholarship_type == scholarship_type]
    if status:
        filtered = [s for s in filtered if s.status == status]
    return filtered

@app.get("/api/sufs/scholarships/{scholarship_id}")
async def get_sufs_scholarship(scholarship_id: str):
    """Get a specific SUFS scholarship"""
    scholarship = next((s for s in sufs_scholarships_db if s.scholarship_id == scholarship_id), None)
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return scholarship

@app.post("/api/sufs/scholarships")
async def create_sufs_scholarship(scholarship_data: dict):
    """Create a new SUFS scholarship record"""
    global sufs_scholarships_db
    new_scholarship = SUFSScholarship(
        scholarship_id=scholarship_data.get('scholarship_id', f"sufs_sch_{len(sufs_scholarships_db)+1}"),
        student_id=scholarship_data['student_id'],
        family_id=scholarship_data['family_id'],
        campus_id=scholarship_data['campus_id'],
        scholarship_type=SUFSScholarshipType(scholarship_data['scholarship_type']),
        award_id=scholarship_data.get('award_id'),
        school_year=scholarship_data['school_year'],
        annual_award_amount=scholarship_data['annual_award_amount'],
        quarterly_amount=scholarship_data.get('quarterly_amount', scholarship_data['annual_award_amount'] / 4),
        remaining_balance=scholarship_data.get('remaining_balance', scholarship_data['annual_award_amount']),
        start_date=date.fromisoformat(scholarship_data['start_date']),
        end_date=date.fromisoformat(scholarship_data['end_date']) if scholarship_data.get('end_date') else None,
        status=scholarship_data.get('status', 'Active'),
        eligibility_verified=scholarship_data.get('eligibility_verified', False),
        eligibility_verified_date=date.fromisoformat(scholarship_data['eligibility_verified_date']) if scholarship_data.get('eligibility_verified_date') else None,
        notes=scholarship_data.get('notes'),
        created_date=date.today(),
        last_updated=date.today()
    )
    sufs_scholarships_db.append(new_scholarship)
    db_utils.save_sufs_scholarship(new_scholarship)
    return {"status": "success", "scholarship_id": new_scholarship.scholarship_id}

@app.put("/api/sufs/scholarships/{scholarship_id}")
async def update_sufs_scholarship(scholarship_id: str, scholarship_data: dict):
    """Update a SUFS scholarship record"""
    for i, s in enumerate(sufs_scholarships_db):
        if s.scholarship_id == scholarship_id:
            updated = s.model_copy(update={
                **scholarship_data,
                'last_updated': date.today()
            })
            sufs_scholarships_db[i] = updated
            db_utils.save_sufs_scholarship(updated)
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Scholarship not found")

@app.get("/api/sufs/claims")
async def get_sufs_claims(
    campus_id: Optional[str] = None,
    student_id: Optional[str] = None,
    family_id: Optional[str] = None,
    scholarship_id: Optional[str] = None,
    status: Optional[SUFSClaimStatus] = None,
    claim_period: Optional[str] = None
):
    """Get all SUFS claims with optional filters"""
    filtered = sufs_claims_db
    if campus_id:
        filtered = [c for c in filtered if c.campus_id == campus_id]
    if student_id:
        filtered = [c for c in filtered if c.student_id == student_id]
    if family_id:
        filtered = [c for c in filtered if c.family_id == family_id]
    if scholarship_id:
        filtered = [c for c in filtered if c.scholarship_id == scholarship_id]
    if status:
        filtered = [c for c in filtered if c.status == status]
    if claim_period:
        filtered = [c for c in filtered if c.claim_period == claim_period]
    return filtered

@app.get("/api/sufs/claims/{claim_id}")
async def get_sufs_claim(claim_id: str):
    """Get a specific SUFS claim"""
    claim = next((c for c in sufs_claims_db if c.claim_id == claim_id), None)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@app.post("/api/sufs/claims")
async def create_sufs_claim(claim_data: dict):
    """Create a new SUFS claim"""
    global sufs_claims_db
    new_claim = SUFSClaim(
        claim_id=claim_data.get('claim_id', f"sufs_claim_{len(sufs_claims_db)+1}"),
        scholarship_id=claim_data['scholarship_id'],
        student_id=claim_data['student_id'],
        family_id=claim_data['family_id'],
        campus_id=claim_data['campus_id'],
        claim_period=claim_data['claim_period'],
        claim_date=date.fromisoformat(claim_data['claim_date']) if claim_data.get('claim_date') else date.today(),
        amount_claimed=claim_data['amount_claimed'],
        tuition_amount=claim_data.get('tuition_amount', claim_data['amount_claimed']),
        fees_amount=claim_data.get('fees_amount', 0),
        status=SUFSClaimStatus(claim_data.get('status', 'Draft')),
        submitted_date=date.fromisoformat(claim_data['submitted_date']) if claim_data.get('submitted_date') else None,
        approved_date=date.fromisoformat(claim_data['approved_date']) if claim_data.get('approved_date') else None,
        paid_date=date.fromisoformat(claim_data['paid_date']) if claim_data.get('paid_date') else None,
        paid_amount=claim_data.get('paid_amount'),
        denial_reason=claim_data.get('denial_reason'),
        sufs_reference_number=claim_data.get('sufs_reference_number'),
        notes=claim_data.get('notes'),
        created_date=date.today(),
        last_updated=date.today()
    )
    sufs_claims_db.append(new_claim)
    db_utils.save_sufs_claim(new_claim)
    return {"status": "success", "claim_id": new_claim.claim_id}

@app.put("/api/sufs/claims/{claim_id}")
async def update_sufs_claim(claim_id: str, claim_data: dict):
    """Update a SUFS claim"""
    for i, c in enumerate(sufs_claims_db):
        if c.claim_id == claim_id:
            updated = c.model_copy(update={
                **claim_data,
                'last_updated': date.today()
            })
            sufs_claims_db[i] = updated
            db_utils.save_sufs_claim(updated)
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Claim not found")

@app.put("/api/sufs/claims/{claim_id}/submit")
async def submit_sufs_claim(claim_id: str):
    """Submit a SUFS claim"""
    for i, c in enumerate(sufs_claims_db):
        if c.claim_id == claim_id:
            updated = c.model_copy(update={
                'status': SUFSClaimStatus.SUBMITTED,
                'submitted_date': date.today(),
                'last_updated': date.today()
            })
            sufs_claims_db[i] = updated
            db_utils.save_sufs_claim(updated)
            return {"status": "success", "message": "Claim submitted successfully"}
    raise HTTPException(status_code=404, detail="Claim not found")

@app.get("/api/sufs/payments")
async def get_sufs_payments(
    campus_id: Optional[str] = None,
    status: Optional[SUFSPaymentStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get all SUFS payments with optional filters"""
    filtered = sufs_payments_db
    if campus_id:
        filtered = [p for p in filtered if p.campus_id == campus_id]
    if status:
        filtered = [p for p in filtered if p.status == status]
    if start_date:
        start = date.fromisoformat(start_date)
        filtered = [p for p in filtered if p.payment_date >= start]
    if end_date:
        end = date.fromisoformat(end_date)
        filtered = [p for p in filtered if p.payment_date <= end]
    return filtered

@app.get("/api/sufs/payments/{payment_id}")
async def get_sufs_payment(payment_id: str):
    """Get a specific SUFS payment"""
    payment = next((p for p in sufs_payments_db if p.payment_id == payment_id), None)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@app.post("/api/sufs/payments")
async def create_sufs_payment(payment_data: dict):
    """Record a new SUFS payment received"""
    global sufs_payments_db
    new_payment = SUFSPayment(
        payment_id=payment_data.get('payment_id', f"sufs_pmt_{len(sufs_payments_db)+1}"),
        campus_id=payment_data['campus_id'],
        payment_date=date.fromisoformat(payment_data['payment_date']),
        deposit_date=date.fromisoformat(payment_data['deposit_date']) if payment_data.get('deposit_date') else None,
        total_amount=payment_data['total_amount'],
        sufs_reference_number=payment_data.get('sufs_reference_number'),
        bank_reference=payment_data.get('bank_reference'),
        status=SUFSPaymentStatus(payment_data.get('status', 'Received')),
        reconciled_date=date.fromisoformat(payment_data['reconciled_date']) if payment_data.get('reconciled_date') else None,
        reconciled_by=payment_data.get('reconciled_by'),
        notes=payment_data.get('notes'),
        created_date=date.today()
    )
    sufs_payments_db.append(new_payment)
    db_utils.save_sufs_payment(new_payment)
    return {"status": "success", "payment_id": new_payment.payment_id}

@app.get("/api/sufs/payment-allocations")
async def get_sufs_payment_allocations(
    payment_id: Optional[str] = None,
    claim_id: Optional[str] = None,
    student_id: Optional[str] = None
):
    """Get payment allocations"""
    filtered = sufs_payment_allocations_db
    if payment_id:
        filtered = [a for a in filtered if a.payment_id == payment_id]
    if claim_id:
        filtered = [a for a in filtered if a.claim_id == claim_id]
    if student_id:
        filtered = [a for a in filtered if a.student_id == student_id]
    return filtered

@app.post("/api/sufs/payment-allocations")
async def create_sufs_payment_allocation(allocation_data: dict):
    """Create a payment allocation to match a payment to claims"""
    global sufs_payment_allocations_db
    new_allocation = SUFSPaymentAllocation(
        allocation_id=allocation_data.get('allocation_id', f"sufs_alloc_{len(sufs_payment_allocations_db)+1}"),
        payment_id=allocation_data['payment_id'],
        claim_id=allocation_data['claim_id'],
        student_id=allocation_data['student_id'],
        family_id=allocation_data['family_id'],
        amount=allocation_data['amount'],
        status=allocation_data.get('status', 'Matched'),
        discrepancy_amount=allocation_data.get('discrepancy_amount'),
        discrepancy_reason=allocation_data.get('discrepancy_reason'),
        created_date=date.today()
    )
    sufs_payment_allocations_db.append(new_allocation)
    db_utils.save_sufs_allocation(new_allocation)
    
    # Update claim status to Paid if fully allocated
    for i, c in enumerate(sufs_claims_db):
        if c.claim_id == allocation_data['claim_id']:
            updated = c.model_copy(update={
                'status': SUFSClaimStatus.PAID,
                'paid_date': date.today(),
                'paid_amount': allocation_data['amount'],
                'last_updated': date.today()
            })
            sufs_claims_db[i] = updated
            db_utils.save_sufs_claim(updated)
            break
    
    return {"status": "success", "allocation_id": new_allocation.allocation_id}

@app.get("/api/sufs/dashboard")
async def get_sufs_dashboard(campus_id: Optional[str] = None):
    """Get SUFS scholarship dashboard summary"""
    scholarships = sufs_scholarships_db
    claims = sufs_claims_db
    payments = sufs_payments_db
    
    if campus_id:
        scholarships = [s for s in scholarships if s.campus_id == campus_id]
        claims = [c for c in claims if c.campus_id == campus_id]
        payments = [p for p in payments if p.campus_id == campus_id]
    
    active_scholarships = [s for s in scholarships if s.status == "Active"]
    
    # Calculate totals
    total_annual_awards = sum(s.annual_award_amount for s in active_scholarships)
    total_remaining = sum(s.remaining_balance for s in active_scholarships)
    
    # Claims by status
    claims_by_status = {}
    for status in SUFSClaimStatus:
        status_claims = [c for c in claims if c.status == status]
        claims_by_status[status.value] = {
            "count": len(status_claims),
            "amount": sum(c.amount_claimed for c in status_claims)
        }
    
    # Payments summary
    total_payments_received = sum(p.total_amount for p in payments)
    pending_payments = [p for p in payments if p.status == SUFSPaymentStatus.PENDING]
    reconciled_payments = [p for p in payments if p.status == SUFSPaymentStatus.RECONCILED]
    
    # Scholarship type breakdown
    scholarship_by_type = {}
    for sch_type in SUFSScholarshipType:
        type_scholarships = [s for s in active_scholarships if s.scholarship_type == sch_type]
        scholarship_by_type[sch_type.value] = {
            "count": len(type_scholarships),
            "total_amount": sum(s.annual_award_amount for s in type_scholarships)
        }
    
    # Outstanding claims (submitted but not paid)
    outstanding_claims = [c for c in claims if c.status in [SUFSClaimStatus.SUBMITTED, SUFSClaimStatus.PENDING, SUFSClaimStatus.APPROVED]]
    total_outstanding = sum(c.amount_claimed for c in outstanding_claims)
    
    return {
        "summary": {
            "total_scholarship_students": len(active_scholarships),
            "total_annual_awards": total_annual_awards,
            "total_remaining_balance": total_remaining,
            "total_payments_received": total_payments_received,
            "total_outstanding_claims": total_outstanding,
            "pending_reconciliation": sum(p.total_amount for p in pending_payments)
        },
        "claims_by_status": claims_by_status,
        "scholarship_by_type": scholarship_by_type,
        "recent_payments": [p.model_dump() for p in sorted(payments, key=lambda x: x.payment_date, reverse=True)[:5]],
        "pending_claims": [c.model_dump() for c in outstanding_claims[:10]]
    }

@app.get("/api/sufs/reconciliation-report")
async def get_sufs_reconciliation_report(
    campus_id: Optional[str] = None,
    period: Optional[str] = None
):
    """Generate a reconciliation report"""
    claims = sufs_claims_db
    payments = sufs_payments_db
    allocations = sufs_payment_allocations_db
    
    if campus_id:
        claims = [c for c in claims if c.campus_id == campus_id]
        payments = [p for p in payments if p.campus_id == campus_id]
    
    if period:
        claims = [c for c in claims if c.claim_period == period]
    
    total_claims_submitted = sum(c.amount_claimed for c in claims if c.status != SUFSClaimStatus.DRAFT)
    total_payments_received = sum(p.total_amount for p in payments)
    
    # Find discrepancies
    discrepancies = [a for a in allocations if a.status == "Discrepancy"]
    total_discrepancies = sum(abs(a.discrepancy_amount or 0) for a in discrepancies)
    
    reconciled_claims = [c for c in claims if c.status == SUFSClaimStatus.PAID]
    
    return {
        "report_period": period or "All Time",
        "generated_date": date.today().isoformat(),
        "total_claims_submitted": total_claims_submitted,
        "total_payments_received": total_payments_received,
        "total_outstanding": total_claims_submitted - sum(c.paid_amount or 0 for c in claims),
        "total_discrepancies": total_discrepancies,
        "claims_count": len(claims),
        "payments_count": len(payments),
        "reconciled_count": len(reconciled_claims),
        "discrepancy_count": len(discrepancies),
        "claims_detail": [c.model_dump() for c in claims],
        "payments_detail": [p.model_dump() for p in payments],
        "discrepancies_detail": [a.model_dump() for a in discrepancies]
    }

@app.get("/api/sufs/student-scholarship-summary/{student_id}")
async def get_student_scholarship_summary(student_id: str):
    """Get scholarship summary for a specific student"""
    scholarships = [s for s in sufs_scholarships_db if s.student_id == student_id]
    claims = [c for c in sufs_claims_db if c.student_id == student_id]
    
    if not scholarships:
        return {
            "has_scholarship": False,
            "student_id": student_id
        }
    
    active_scholarship = next((s for s in scholarships if s.status == "Active"), None)
    
    total_claimed = sum(c.amount_claimed for c in claims)
    total_paid = sum(c.paid_amount or 0 for c in claims if c.status == SUFSClaimStatus.PAID)
    pending_claims = [c for c in claims if c.status in [SUFSClaimStatus.SUBMITTED, SUFSClaimStatus.PENDING, SUFSClaimStatus.APPROVED]]
    
    return {
        "has_scholarship": True,
        "student_id": student_id,
        "scholarship": active_scholarship.model_dump() if active_scholarship else None,
        "all_scholarships": [s.model_dump() for s in scholarships],
        "total_claimed": total_claimed,
        "total_paid": total_paid,
        "pending_amount": sum(c.amount_claimed for c in pending_claims),
        "claims_history": [c.model_dump() for c in sorted(claims, key=lambda x: x.claim_date, reverse=True)]
    }

@app.get("/api/sufs/family-scholarship-summary/{family_id}")
async def get_family_scholarship_summary(family_id: str):
    """Get scholarship summary for a family (all children)"""
    scholarships = [s for s in sufs_scholarships_db if s.family_id == family_id]
    claims = [c for c in sufs_claims_db if c.family_id == family_id]
    
    students_with_scholarships = list(set(s.student_id for s in scholarships))
    
    total_annual_awards = sum(s.annual_award_amount for s in scholarships if s.status == "Active")
    total_claimed = sum(c.amount_claimed for c in claims)
    total_paid = sum(c.paid_amount or 0 for c in claims if c.status == SUFSClaimStatus.PAID)
    
    return {
        "family_id": family_id,
        "students_with_scholarships": len(students_with_scholarships),
        "total_annual_awards": total_annual_awards,
        "total_claimed": total_claimed,
        "total_paid": total_paid,
        "outstanding_balance": total_claimed - total_paid,
        "scholarships": [s.model_dump() for s in scholarships],
        "recent_claims": [c.model_dump() for c in sorted(claims, key=lambda x: x.claim_date, reverse=True)[:10]]
    }

# ============================================
# CSV Import Endpoints for IXL and Acellus
# ============================================

class CSVImportRequest(BaseModel):
    csv_content: str
    platform: str  # "ixl" or "acellus"

class CSVImportResult(BaseModel):
    success: bool
    records_processed: int
    records_updated: int
    records_failed: int
    errors: List[str]
    updated_students: List[str]

def match_student_by_name(first_name: str, last_name: str) -> Optional[Student]:
    """Find a student by first and last name (case-insensitive)"""
    for student in students_db:
        if (student.first_name.lower() == first_name.lower() and 
            student.last_name.lower() == last_name.lower()):
            return student
    return None

@app.post("/api/import/ixl", response_model=CSVImportResult)
async def import_ixl_csv(request: CSVImportRequest):
    """
    Import IXL progress data from CSV.
    Expected columns: Student Name (or First Name, Last Name), Skills Mastered, 
    Time Spent (hours), Math Score, ELA Score, Last Active Date
    """
    errors = []
    records_processed = 0
    records_updated = 0
    updated_students = []
    
    try:
        reader = csv.DictReader(io.StringIO(request.csv_content))
        rows = list(reader)
        
        for row in rows:
            records_processed += 1
            try:
                # Try to extract student name
                first_name = None
                last_name = None
                
                if 'First Name' in row and 'Last Name' in row:
                    first_name = row['First Name'].strip()
                    last_name = row['Last Name'].strip()
                elif 'Student Name' in row:
                    name_parts = row['Student Name'].strip().split()
                    if len(name_parts) >= 2:
                        first_name = name_parts[0]
                        last_name = ' '.join(name_parts[1:])
                elif 'Name' in row:
                    name_parts = row['Name'].strip().split()
                    if len(name_parts) >= 2:
                        first_name = name_parts[0]
                        last_name = ' '.join(name_parts[1:])
                
                if not first_name or not last_name:
                    errors.append(f"Row {records_processed}: Could not extract student name")
                    continue
                
                student = match_student_by_name(first_name, last_name)
                if not student:
                    errors.append(f"Row {records_processed}: Student '{first_name} {last_name}' not found in system")
                    continue
                
                # Extract IXL data with flexible column names
                skills_mastered = 0
                time_spent = 0.0
                math_score = None
                ela_score = None
                
                # Skills mastered
                for col in ['Skills Mastered', 'Total Skills', 'Skills', 'Mastered']:
                    if col in row and row[col]:
                        try:
                            skills_mastered = int(row[col].replace(',', ''))
                            break
                        except ValueError:
                            pass
                
                # Time spent
                for col in ['Time Spent', 'Hours', 'Time (hours)', 'Total Time', 'Time Spent (hours)']:
                    if col in row and row[col]:
                        try:
                            time_spent = float(row[col].replace(',', '').replace('h', '').strip())
                            break
                        except ValueError:
                            pass
                
                # Math score/proficiency
                for col in ['Math Score', 'Math', 'Math Proficiency', 'Math %']:
                    if col in row and row[col]:
                        math_score = row[col].strip()
                        break
                
                # ELA score/proficiency
                for col in ['ELA Score', 'ELA', 'ELA Proficiency', 'Reading', 'Language Arts', 'ELA %']:
                    if col in row and row[col]:
                        ela_score = row[col].strip()
                        break
                
                # Determine proficiency status
                def get_ixl_status(score_str):
                    if not score_str:
                        return IXLStatus.ON_TRACK
                    score_str = score_str.lower()
                    if any(x in score_str for x in ['behind', 'needs', 'attention', 'low', 'at risk']):
                        return IXLStatus.NEEDS_ATTENTION
                    try:
                        score = float(score_str.replace('%', ''))
                        return IXLStatus.NEEDS_ATTENTION if score < 70 else IXLStatus.ON_TRACK
                    except ValueError:
                        return IXLStatus.ON_TRACK
                
                # Find or create IXL summary for this student
                existing_summary = None
                for summary in ixl_summaries_db:
                    if summary.student_id == student.student_id:
                        existing_summary = summary
                        break
                
                if existing_summary:
                    # Update existing summary
                    existing_summary.skills_mastered_total = skills_mastered
                    existing_summary.weekly_hours = time_spent
                    existing_summary.math_proficiency = get_ixl_status(math_score)
                    existing_summary.ela_proficiency = get_ixl_status(ela_score)
                    existing_summary.last_active_date = date.today()
                    db_utils.save_ixl_summary(existing_summary)
                else:
                    # Create new summary
                    new_summary = IXLSummary(
                        ixl_summary_id=f"ixl_import_{student.student_id}_{date.today().isoformat()}",
                        student_id=student.student_id,
                        week_start_date=date.today() - timedelta(days=date.today().weekday()),
                        weekly_hours=time_spent,
                        skills_practiced_this_week=min(skills_mastered, 50),
                        skills_mastered_total=skills_mastered,
                        math_proficiency=get_ixl_status(math_score),
                        ela_proficiency=get_ixl_status(ela_score),
                        last_active_date=date.today(),
                        recent_skills=["Imported from CSV"]
                    )
                    ixl_summaries_db.append(new_summary)
                    db_utils.save_ixl_summary(new_summary)
                
                # Update student's IXL status flag
                math_status = get_ixl_status(math_score)
                ela_status = get_ixl_status(ela_score)
                if math_status == IXLStatus.NEEDS_ATTENTION or ela_status == IXLStatus.NEEDS_ATTENTION:
                    student.ixl_status_flag = IXLStatus.NEEDS_ATTENTION
                else:
                    student.ixl_status_flag = IXLStatus.ON_TRACK
                db_utils.save_student(student)
                
                records_updated += 1
                updated_students.append(f"{first_name} {last_name}")
                
            except Exception as e:
                errors.append(f"Row {records_processed}: Error processing - {str(e)}")
        
    except Exception as e:
        errors.append(f"CSV parsing error: {str(e)}")
    
    return CSVImportResult(
        success=records_updated > 0,
        records_processed=records_processed,
        records_updated=records_updated,
        records_failed=records_processed - records_updated,
        errors=errors[:20],  # Limit errors to first 20
        updated_students=updated_students
    )

@app.post("/api/import/acellus", response_model=CSVImportResult)
async def import_acellus_csv(request: CSVImportRequest):
    """
    Import Acellus progress data from CSV.
    Expected columns: Student Name (or First Name, Last Name), Course Name,
    Progress %, Grade %, Time Spent, Status
    """
    errors = []
    records_processed = 0
    records_updated = 0
    updated_students = []
    students_updated_set = set()
    
    try:
        reader = csv.DictReader(io.StringIO(request.csv_content))
        rows = list(reader)
        
        for row in rows:
            records_processed += 1
            try:
                # Try to extract student name
                first_name = None
                last_name = None
                
                if 'First Name' in row and 'Last Name' in row:
                    first_name = row['First Name'].strip()
                    last_name = row['Last Name'].strip()
                elif 'Student Name' in row:
                    name_parts = row['Student Name'].strip().split()
                    if len(name_parts) >= 2:
                        first_name = name_parts[0]
                        last_name = ' '.join(name_parts[1:])
                elif 'Name' in row:
                    name_parts = row['Name'].strip().split()
                    if len(name_parts) >= 2:
                        first_name = name_parts[0]
                        last_name = ' '.join(name_parts[1:])
                
                if not first_name or not last_name:
                    errors.append(f"Row {records_processed}: Could not extract student name")
                    continue
                
                student = match_student_by_name(first_name, last_name)
                if not student:
                    errors.append(f"Row {records_processed}: Student '{first_name} {last_name}' not found in system")
                    continue
                
                # Extract course data
                course_name = None
                for col in ['Course Name', 'Course', 'Subject', 'Class']:
                    if col in row and row[col]:
                        course_name = row[col].strip()
                        break
                
                if not course_name:
                    course_name = "General Studies"
                
                # Extract progress percentage
                progress_pct = 0.0
                for col in ['Progress %', 'Progress', 'Completion %', 'Completion', 'Steps Completed %']:
                    if col in row and row[col]:
                        try:
                            progress_pct = float(row[col].replace('%', '').replace(',', '').strip())
                            break
                        except ValueError:
                            pass
                
                # Extract grade percentage
                grade_pct = 0.0
                for col in ['Grade %', 'Grade', 'Score', 'Average', 'Current Grade']:
                    if col in row and row[col]:
                        try:
                            val = row[col].replace('%', '').replace(',', '').strip()
                            # Handle letter grades
                            letter_grades = {'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 55}
                            if val.upper() in letter_grades:
                                grade_pct = letter_grades[val.upper()]
                            else:
                                grade_pct = float(val)
                            break
                        except ValueError:
                            pass
                
                # Extract time spent
                time_spent = 0.0
                for col in ['Time Spent', 'Hours', 'Time (hours)', 'Total Time']:
                    if col in row and row[col]:
                        try:
                            time_spent = float(row[col].replace(',', '').replace('h', '').strip())
                            break
                        except ValueError:
                            pass
                
                # Determine status
                def get_acellus_status(progress, grade):
                    if progress < 50 or grade < 60:
                        return AcellusStatus.AT_RISK
                    elif progress < 75 or grade < 70:
                        return AcellusStatus.BEHIND
                    return AcellusStatus.ON_TRACK
                
                status = get_acellus_status(progress_pct, grade_pct)
                
                # Convert grade percentage to letter grade
                def pct_to_letter(pct):
                    if pct >= 90: return 'A'
                    if pct >= 80: return 'B'
                    if pct >= 70: return 'C'
                    if pct >= 60: return 'D'
                    return 'F'
                
                # Find or create Acellus course for this student
                existing_course = None
                for course in acellus_courses_db:
                    if course.student_id == student.student_id and course.course_name == course_name:
                        existing_course = course
                        break
                
                if existing_course:
                    # Update existing course
                    existing_course.completion_percentage = progress_pct
                    existing_course.grade_percentage = grade_pct
                    existing_course.current_grade = pct_to_letter(grade_pct)
                    existing_course.time_spent_hours = time_spent
                    existing_course.status = status
                    existing_course.last_activity_date = date.today()
                    db_utils.save_acellus_course(existing_course)
                else:
                    # Create new course
                    new_course = AcellusCourse(
                        course_id=f"acellus_import_{student.student_id}_{course_name.replace(' ', '_')}_{date.today().isoformat()}",
                        student_id=student.student_id,
                        course_name=course_name,
                        subject=course_name.split()[0] if course_name else "General",
                        total_steps=100,
                        completed_steps=int(progress_pct),
                        completion_percentage=progress_pct,
                        current_grade=pct_to_letter(grade_pct),
                        grade_percentage=grade_pct,
                        status=status,
                        last_activity_date=date.today(),
                        time_spent_hours=time_spent
                    )
                    acellus_courses_db.append(new_course)
                    db_utils.save_acellus_course(new_course)
                
                # Update or create Acellus summary for this student
                existing_summary = None
                for summary in acellus_summaries_db:
                    if summary.student_id == student.student_id:
                        existing_summary = summary
                        break
                
                # Recalculate summary based on all courses for this student
                student_courses = [c for c in acellus_courses_db if c.student_id == student.student_id]
                total_courses = len(student_courses)
                courses_on_track = len([c for c in student_courses if c.status == AcellusStatus.ON_TRACK])
                courses_behind = len([c for c in student_courses if c.status in [AcellusStatus.BEHIND, AcellusStatus.AT_RISK]])
                avg_gpa = sum(c.grade_percentage for c in student_courses) / total_courses if total_courses > 0 else 0
                total_time = sum(c.time_spent_hours for c in student_courses)
                
                # Determine overall status
                if courses_behind > total_courses / 2:
                    overall_status = AcellusStatus.AT_RISK
                elif courses_behind > 0:
                    overall_status = AcellusStatus.BEHIND
                else:
                    overall_status = AcellusStatus.ON_TRACK
                
                if existing_summary:
                    existing_summary.total_courses = total_courses
                    existing_summary.courses_on_track = courses_on_track
                    existing_summary.courses_behind = courses_behind
                    existing_summary.overall_gpa = avg_gpa / 25  # Convert to 4.0 scale
                    existing_summary.total_time_spent_hours = total_time
                    existing_summary.last_active_date = date.today()
                    existing_summary.overall_status = overall_status
                    db_utils.save_acellus_summary(existing_summary)
                else:
                    new_summary = AcellusSummary(
                        acellus_summary_id=f"acellus_summary_{student.student_id}_{date.today().isoformat()}",
                        student_id=student.student_id,
                        total_courses=total_courses,
                        courses_on_track=courses_on_track,
                        courses_behind=courses_behind,
                        overall_gpa=avg_gpa / 25,
                        total_time_spent_hours=total_time,
                        last_active_date=date.today(),
                        overall_status=overall_status
                    )
                    acellus_summaries_db.append(new_summary)
                    db_utils.save_acellus_summary(new_summary)
                
                records_updated += 1
                if student.student_id not in students_updated_set:
                    students_updated_set.add(student.student_id)
                    updated_students.append(f"{first_name} {last_name}")
                
            except Exception as e:
                errors.append(f"Row {records_processed}: Error processing - {str(e)}")
        
    except Exception as e:
        errors.append(f"CSV parsing error: {str(e)}")
    
    return CSVImportResult(
        success=records_updated > 0,
        records_processed=records_processed,
        records_updated=records_updated,
        records_failed=records_processed - records_updated,
        errors=errors[:20],
        updated_students=updated_students
    )

@app.get("/api/import/template/{platform}")
async def get_import_template(platform: str):
    """Get a CSV template for importing data"""
    if platform == "ixl":
        template = "First Name,Last Name,Skills Mastered,Time Spent (hours),Math Score,ELA Score\n"
        template += "John,Smith,150,25.5,85%,78%\n"
        template += "Jane,Doe,200,30.0,On track,Needs attention\n"
        return StreamingResponse(
            io.StringIO(template),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ixl_import_template.csv"}
        )
    elif platform == "acellus":
        template = "First Name,Last Name,Course Name,Progress %,Grade %,Time Spent (hours)\n"
        template += "John,Smith,Algebra 1,75,82,45.5\n"
        template += "John,Smith,English 9,80,88,38.0\n"
        template += "Jane,Doe,Biology,65,71,52.0\n"
        return StreamingResponse(
            io.StringIO(template),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=acellus_import_template.csv"}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid platform. Use 'ixl' or 'acellus'")

# ============================================
# Simplified Billing Summary Endpoint
# ============================================

@app.get("/api/families/{family_id}/billing-summary")
async def get_family_billing_summary(family_id: str):
    """Get simplified billing summary for a family showing scholarship vs parent responsibility"""
    
    # Find the family
    family = None
    for f in families_db:
        if f.family_id == family_id:
            family = f
            break
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Get students in this family
    family_students = [s for s in students_db if s.family_id == family_id]
    num_students = len(family_students)
    
    # Calculate annual tuition (assuming $10,000 per student per year)
    annual_tuition_per_student = 10000
    annual_tuition = annual_tuition_per_student * num_students
    
    # Get scholarship amounts for this family's students
    total_scholarship = 0
    for scholarship in sufs_scholarships_db:
        if scholarship.family_id == family_id and scholarship.status == "Active":
            total_scholarship += scholarship.annual_award_amount
    
    # Calculate parent responsibility
    parent_responsibility = max(0, annual_tuition - total_scholarship)
    monthly_parent_payment = parent_responsibility / 12
    
    # Calculate year-to-date payments
    scholarship_received_ytd = 0
    parent_paid_ytd = 0
    
    for record in billing_records_db:
        if record.family_id == family_id and record.type == "Payment":
            if record.source == PaymentSource.STEP_UP:
                scholarship_received_ytd += abs(record.amount)
            elif record.source == PaymentSource.OUT_OF_POCKET:
                parent_paid_ytd += abs(record.amount)
    
    total_paid_ytd = scholarship_received_ytd + parent_paid_ytd
    
    # Generate payment schedule (next 6 months)
    payment_schedule = []
    today = date.today()
    
    # Parent payments (monthly on the 1st)
    for i in range(6):
        month_offset = i + 1
        payment_date = date(today.year, today.month, 1) + timedelta(days=30 * month_offset)
        payment_schedule.append({
            "due_date": payment_date.isoformat(),
            "amount": monthly_parent_payment,
            "type": "parent",
            "status": "pending"
        })
    
    # Scholarship payments (every 2 months)
    bi_monthly_scholarship = total_scholarship / 6  # 6 payments per year
    for i in range(3):
        month_offset = (i + 1) * 2
        payment_date = date(today.year, today.month, 15) + timedelta(days=30 * month_offset)
        payment_schedule.append({
            "due_date": payment_date.isoformat(),
            "amount": bi_monthly_scholarship,
            "type": "scholarship",
            "status": "pending"
        })
    
    # Sort by date
    payment_schedule.sort(key=lambda x: x["due_date"])
    
    # Calculate next payment due
    next_payment_due = payment_schedule[0]["due_date"] if payment_schedule else today.isoformat()
    next_payment_amount = monthly_parent_payment
    
    return {
        "family_id": family_id,
        "family_name": family.family_name,
        "annual_tuition": annual_tuition,
        "scholarship_amount": total_scholarship,
        "parent_responsibility": parent_responsibility,
        "monthly_parent_payment": monthly_parent_payment,
        "total_paid_ytd": total_paid_ytd,
        "scholarship_received_ytd": scholarship_received_ytd,
        "parent_paid_ytd": parent_paid_ytd,
        "current_balance": family.current_balance,
        "next_payment_due": next_payment_due,
        "next_payment_amount": next_payment_amount,
        "payment_schedule": payment_schedule
    }

# ============================================
# SUFS Payment Queue Endpoint
# ============================================

@app.get("/api/sufs/payment-queue")
async def get_sufs_payment_queue(campus_id: Optional[str] = None):
    """Get expected SUFS payments queue for admins"""
    
    today = date.today()
    
    # Get all active scholarships
    active_scholarships = [s for s in sufs_scholarships_db if s.status == "Active"]
    if campus_id:
        active_scholarships = [s for s in active_scholarships if s.campus_id == campus_id]
    
    # Calculate expected payments (bi-monthly schedule)
    expected_payments = []
    
    # SUFS pays every 2 months: Aug, Oct, Dec, Feb, Apr, Jun
    payment_months = [8, 10, 12, 2, 4, 6]
    current_month = today.month
    
    # Find next payment month
    next_payment_month = None
    for month in payment_months:
        if month >= current_month:
            next_payment_month = month
            break
    if not next_payment_month:
        next_payment_month = payment_months[0]  # Next year
    
    # Generate expected payments for each scholarship
    for scholarship in active_scholarships:
        # Get student info
        student = None
        for s in students_db:
            if s.student_id == scholarship.student_id:
                student = s
                break
        
        # Get family info
        family = None
        for f in families_db:
            if f.family_id == scholarship.family_id:
                family = f
                break
        
        if not student or not family:
            continue
        
        # Calculate bi-monthly payment amount
        bi_monthly_amount = scholarship.annual_award_amount / 6
        
        # Check if this payment has already been received
        already_received = False
        for claim in sufs_claims_db:
            if (claim.scholarship_id == scholarship.scholarship_id and 
                claim.status == "Paid" and
                claim.claim_period == f"{today.year}-{next_payment_month:02d}"):
                already_received = True
                break
        
        expected_payments.append({
            "scholarship_id": scholarship.scholarship_id,
            "student_id": scholarship.student_id,
            "student_name": f"{student.first_name} {student.last_name}",
            "family_id": scholarship.family_id,
            "family_name": family.family_name,
            "scholarship_type": scholarship.scholarship_type,
            "expected_amount": bi_monthly_amount,
            "expected_date": f"{today.year}-{next_payment_month:02d}-15",
            "status": "received" if already_received else "expected",
            "remaining_balance": scholarship.remaining_balance
        })
    
    # Sort by family name
    expected_payments.sort(key=lambda x: x["family_name"])
    
    # Calculate totals
    total_expected = sum(p["expected_amount"] for p in expected_payments if p["status"] == "expected")
    total_received = sum(p["expected_amount"] for p in expected_payments if p["status"] == "received")
    
    return {
        "payment_period": f"{today.year}-{next_payment_month:02d}",
        "total_scholarships": len(expected_payments),
        "total_expected_amount": total_expected,
        "total_received_amount": total_received,
        "payments": expected_payments
    }

@app.post("/api/sufs/mark-received/{scholarship_id}")
async def mark_sufs_payment_received(scholarship_id: str, amount: Optional[float] = None):
    """One-click mark SUFS payment as received"""
    
    # Find the scholarship
    scholarship = None
    for s in sufs_scholarships_db:
        if s.scholarship_id == scholarship_id:
            scholarship = s
            break
    
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    # Calculate expected amount if not provided
    if amount is None:
        amount = scholarship.annual_award_amount / 6  # Bi-monthly payment
    
    today = date.today()
    
    # Create a claim record
    new_claim = SUFSClaim(
        claim_id=f"claim_{scholarship_id}_{today.isoformat()}",
        scholarship_id=scholarship_id,
        student_id=scholarship.student_id,
        family_id=scholarship.family_id,
        campus_id=scholarship.campus_id,
        claim_period=f"{today.year}-{today.month:02d}",
        claim_date=today,
        amount_claimed=amount,
        tuition_amount=amount,
        fees_amount=0,
        status="Paid",
        submitted_date=today,
        approved_date=today,
        paid_date=today,
        paid_amount=amount,
        denial_reason="",
        sufs_reference_number=f"SUFS-{today.strftime('%Y%m%d')}-{scholarship_id[-4:]}",
        notes="Marked as received via one-click",
        created_date=today,
        last_updated=today
    )
    sufs_claims_db.append(new_claim)
    db_utils.save_sufs_claim(new_claim)
    
    # Update scholarship remaining balance
    scholarship.remaining_balance = max(0, scholarship.remaining_balance - amount)
    db_utils.save_sufs_scholarship(scholarship)
    
    # Create a billing record for the family
    family = None
    for f in families_db:
        if f.family_id == scholarship.family_id:
            family = f
            break
    
    if family:
        # Create payment record
        new_billing = BillingRecord(
            billing_record_id=f"billing_sufs_{today.isoformat()}_{scholarship_id[-4:]}",
            family_id=scholarship.family_id,
            student_id=scholarship.student_id,
            campus_id=scholarship.campus_id,
            date=today,
            type="Payment",
            description=f"SUFS Scholarship Payment - {scholarship.scholarship_type}",
            amount=-amount,  # Negative for payment/credit
            source=PaymentSource.STEP_UP
        )
        billing_records_db.append(new_billing)
        db_utils.save_billing_record(new_billing)
        
        # Update family balance
        family.current_balance = max(0, family.current_balance - amount)
        db_utils.save_family(family)
    
    return {
        "success": True,
        "message": f"Payment of ${amount:,.2f} marked as received",
        "claim_id": new_claim.claim_id,
        "new_remaining_balance": scholarship.remaining_balance
    }


# ============== Export Download Endpoint ==============

@app.get("/api/exports/{export_id}")
async def download_export(export_id: str):
    """Download a generated export file (CSV, Excel, or PDF)"""
    from app.exports import get_export
    
    export = get_export(export_id)
    
    if not export:
        raise HTTPException(status_code=404, detail="Export not found or has expired")
    
    # Return the file as a streaming response
    return StreamingResponse(
        io.BytesIO(export["file_bytes"]),
        media_type=export["mime_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{export["filename"]}"'
        }
    )


# ============== QuickBooks Integration ==============

# In-memory storage for QuickBooks connection status
quickbooks_connection = {
    "connected": False,
    "company_name": None,
    "company_id": None,
    "connected_at": None,
    "last_sync": None,
    "sync_settings": {
        "auto_sync_invoices": True,
        "auto_sync_payments": True,
        "sync_frequency": "daily"
    }
}

# Simulated sync history
quickbooks_sync_history = []

@app.get("/api/quickbooks/status")
async def get_quickbooks_status():
    """Get QuickBooks connection status"""
    return quickbooks_connection

@app.post("/api/quickbooks/connect")
async def connect_quickbooks(data: dict):
    """Initiate QuickBooks OAuth connection"""
    # In production, this would redirect to QuickBooks OAuth
    # For demo, we simulate a successful connection
    quickbooks_connection["connected"] = True
    quickbooks_connection["company_name"] = data.get("company_name", "EPIC Prep Academy")
    quickbooks_connection["company_id"] = f"qb_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    quickbooks_connection["connected_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": "Successfully connected to QuickBooks",
        "auth_url": None,  # In production, this would be the OAuth URL
        "connection": quickbooks_connection
    }

@app.post("/api/quickbooks/disconnect")
async def disconnect_quickbooks():
    """Disconnect from QuickBooks"""
    quickbooks_connection["connected"] = False
    quickbooks_connection["company_name"] = None
    quickbooks_connection["company_id"] = None
    quickbooks_connection["connected_at"] = None
    
    return {
        "success": True,
        "message": "Disconnected from QuickBooks"
    }

@app.put("/api/quickbooks/settings")
async def update_quickbooks_settings(settings: dict):
    """Update QuickBooks sync settings"""
    if "auto_sync_invoices" in settings:
        quickbooks_connection["sync_settings"]["auto_sync_invoices"] = settings["auto_sync_invoices"]
    if "auto_sync_payments" in settings:
        quickbooks_connection["sync_settings"]["auto_sync_payments"] = settings["auto_sync_payments"]
    if "sync_frequency" in settings:
        quickbooks_connection["sync_settings"]["sync_frequency"] = settings["sync_frequency"]
    
    return {
        "success": True,
        "settings": quickbooks_connection["sync_settings"]
    }

@app.post("/api/quickbooks/sync/invoices")
async def sync_invoices_to_quickbooks():
    """Sync invoices to QuickBooks"""
    if not quickbooks_connection["connected"]:
        raise HTTPException(status_code=400, detail="QuickBooks not connected")
    
    # Get all invoices
    invoices_count = len(invoices_db)
    
    # Simulate sync
    sync_record = {
        "sync_id": f"sync_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "invoices",
        "direction": "export",
        "records_synced": invoices_count,
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "details": f"Exported {invoices_count} invoices to QuickBooks"
    }
    quickbooks_sync_history.insert(0, sync_record)
    quickbooks_connection["last_sync"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": f"Successfully synced {invoices_count} invoices to QuickBooks",
        "sync_record": sync_record
    }

@app.post("/api/quickbooks/sync/payments")
async def sync_payments_to_quickbooks():
    """Sync payments to QuickBooks"""
    if not quickbooks_connection["connected"]:
        raise HTTPException(status_code=400, detail="QuickBooks not connected")
    
    # Get all payment records
    payments = [b for b in billing_records_db if b.type == "Payment"]
    payments_count = len(payments)
    
    # Simulate sync
    sync_record = {
        "sync_id": f"sync_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "payments",
        "direction": "export",
        "records_synced": payments_count,
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "details": f"Exported {payments_count} payments to QuickBooks"
    }
    quickbooks_sync_history.insert(0, sync_record)
    quickbooks_connection["last_sync"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": f"Successfully synced {payments_count} payments to QuickBooks",
        "sync_record": sync_record
    }

@app.post("/api/quickbooks/sync/customers")
async def sync_customers_to_quickbooks():
    """Sync families as customers to QuickBooks"""
    if not quickbooks_connection["connected"]:
        raise HTTPException(status_code=400, detail="QuickBooks not connected")
    
    # Get all families
    families_count = len(families_db)
    
    # Simulate sync
    sync_record = {
        "sync_id": f"sync_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "customers",
        "direction": "export",
        "records_synced": families_count,
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "details": f"Exported {families_count} families as customers to QuickBooks"
    }
    quickbooks_sync_history.insert(0, sync_record)
    quickbooks_connection["last_sync"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": f"Successfully synced {families_count} customers to QuickBooks",
        "sync_record": sync_record
    }

@app.post("/api/quickbooks/sync/all")
async def sync_all_to_quickbooks():
    """Sync all data to QuickBooks"""
    if not quickbooks_connection["connected"]:
        raise HTTPException(status_code=400, detail="QuickBooks not connected")
    
    families_count = len(families_db)
    invoices_count = len(invoices_db)
    payments = [b for b in billing_records_db if b.type == "Payment"]
    payments_count = len(payments)
    
    total_records = families_count + invoices_count + payments_count
    
    # Simulate sync
    sync_record = {
        "sync_id": f"sync_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "full_sync",
        "direction": "export",
        "records_synced": total_records,
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "details": f"Full sync: {families_count} customers, {invoices_count} invoices, {payments_count} payments"
    }
    quickbooks_sync_history.insert(0, sync_record)
    quickbooks_connection["last_sync"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": f"Successfully synced {total_records} records to QuickBooks",
        "sync_record": sync_record,
        "breakdown": {
            "customers": families_count,
            "invoices": invoices_count,
            "payments": payments_count
        }
    }

@app.get("/api/quickbooks/sync/history")
async def get_sync_history():
    """Get QuickBooks sync history"""
    return quickbooks_sync_history[:20]  # Return last 20 syncs

@app.get("/api/quickbooks/export/preview")
async def preview_quickbooks_export():
    """Preview data that would be exported to QuickBooks"""
    families_count = len(families_db)
    invoices_count = len(invoices_db)
    payments = [b for b in billing_records_db if b.type == "Payment"]
    payments_count = len(payments)
    
    # Calculate totals
    total_invoiced = sum(inv.total_amount for inv in invoices_db)
    total_payments = sum(abs(p.amount) for p in payments)
    total_outstanding = sum(f.current_balance for f in families_db)
    
    return {
        "customers": {
            "count": families_count,
            "sample": [{"name": f.family_name, "balance": f.current_balance} for f in families_db[:5]]
        },
        "invoices": {
            "count": invoices_count,
            "total_amount": total_invoiced,
            "sample": [{"number": inv.invoice_number, "amount": inv.total_amount, "status": inv.status.value} for inv in invoices_db[:5]]
        },
        "payments": {
            "count": payments_count,
            "total_amount": total_payments
        },
        "summary": {
            "total_invoiced": total_invoiced,
            "total_payments": total_payments,
            "total_outstanding": total_outstanding
        }
    }


# ============================================================================
# Admin: Database Reset Endpoint
# ============================================================================

@app.post("/api/admin/reset-database")
async def reset_database(confirm: str = Query(..., description="Must be 'CONFIRM_RESET' to proceed")):
    """
    Wipe ALL data from the database and in-memory lists for production deployment.
    Requires confirm='CONFIRM_RESET' as a safety measure.
    After reset, the database will be empty — no demo data will be seeded.
    """
    if confirm != "CONFIRM_RESET":
        raise HTTPException(
            status_code=400,
            detail="You must pass confirm='CONFIRM_RESET' to wipe all data. This action is irreversible."
        )

    global students_db, families_db, parents_db, staff_db, grade_records_db
    global behavior_notes_db, attendance_records_db, ixl_summaries_db
    global acellus_courses_db, acellus_summaries_db, billing_records_db
    global conferences_db, messages_db, events_db, event_rsvps_db
    global documents_db, document_signatures_db, products_db, orders_db
    global photo_albums_db, incidents_db, health_records_db
    global invoices_db, invoice_line_items_db, payment_plans_db, payment_schedules_db
    global leads_db, campus_capacities_db, message_templates_db
    global broadcast_messages_db, automated_alerts_db
    global academic_standards_db, standard_assessments_db, progress_reports_db
    global iep_plans_db, accommodations_db, iep_goals_db
    global intervention_plans_db, intervention_progress_db
    global at_risk_assessments_db, retention_predictions_db, enrollment_forecasts_db
    global assignments_db, grade_entries_db
    global announcements_db, announcement_reads_db, event_workflows_db
    global sufs_scholarships_db, sufs_claims_db, sufs_payments_db, sufs_allocations_db
    global time_off_requests_db

    # Clear all in-memory lists
    students_db = []
    families_db = []
    parents_db = []
    staff_db = []
    grade_records_db = []
    behavior_notes_db = []
    attendance_records_db = []
    ixl_summaries_db = []
    acellus_courses_db = []
    acellus_summaries_db = []
    billing_records_db = []
    conferences_db = []
    messages_db = []
    events_db = []
    event_rsvps_db = []
    documents_db = []
    document_signatures_db = []
    products_db = []
    orders_db = []
    photo_albums_db = []
    incidents_db = []
    health_records_db = []
    invoices_db = []
    invoice_line_items_db = []
    payment_plans_db = []
    payment_schedules_db = []
    leads_db = []
    campus_capacities_db = []
    message_templates_db = []
    broadcast_messages_db = []
    automated_alerts_db = []
    academic_standards_db = []
    standard_assessments_db = []
    progress_reports_db = []
    iep_plans_db = []
    accommodations_db = []
    iep_goals_db = []
    intervention_plans_db = []
    intervention_progress_db = []
    at_risk_assessments_db = []
    retention_predictions_db = []
    enrollment_forecasts_db = []
    assignments_db = []
    grade_entries_db = []
    announcements_db = []
    announcement_reads_db = []
    event_workflows_db = []
    sufs_scholarships_db = []
    sufs_claims_db = []
    sufs_payments_db = []
    sufs_allocations_db = []
    time_off_requests_db = []

    # Wipe the database
    db_utils.reset_all_data()

    return {
        "message": "Database reset complete. All demo data has been wiped.",
        "status": "success"
    }


# ============================================================================
# Time-Off Requests (Staff)
# ============================================================================

class TimeOffRequestStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    DENIED = "Denied"

class TimeOffRequest(BaseModel):
    request_id: str
    staff_id: str
    start_date: date
    end_date: date
    reason: str
    status: TimeOffRequestStatus = TimeOffRequestStatus.PENDING
    submitted_date: Optional[date] = None
    reviewed_by: Optional[str] = None
    review_date: Optional[date] = None

time_off_requests_db: List[TimeOffRequest] = []

@app.get("/api/time-off-requests", response_model=List[TimeOffRequest])
async def get_time_off_requests(staff_id: Optional[str] = None):
    if staff_id:
        return [r for r in time_off_requests_db if r.staff_id == staff_id]
    return time_off_requests_db

@app.post("/api/time-off-requests", response_model=TimeOffRequest)
async def create_time_off_request(request: TimeOffRequest):
    if any(r.request_id == request.request_id for r in time_off_requests_db):
        raise HTTPException(status_code=400, detail="Time-off request ID already exists")
    staff = next((s for s in staff_db if s.staff_id == request.staff_id), None)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if not request.submitted_date:
        request.submitted_date = date.today()
    time_off_requests_db.append(request)
    db_utils.save_time_off_request(request)
    return request

@app.put("/api/time-off-requests/{request_id}")
async def update_time_off_request(request_id: str, status: TimeOffRequestStatus, reviewed_by: Optional[str] = None):
    request = next((r for r in time_off_requests_db if r.request_id == request_id), None)
    if not request:
        raise HTTPException(status_code=404, detail="Time-off request not found")
    request.status = status
    request.reviewed_by = reviewed_by
    request.review_date = date.today()
    db_utils.save_time_off_request(request)
    return request
