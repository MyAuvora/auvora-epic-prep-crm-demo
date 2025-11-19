from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date, timedelta
import random
from enum import Enum
import csv
import io

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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

class RiskFlag(str, Enum):
    NONE = "None"
    WATCH = "Watch"
    AT_RISK = "At risk"

class StaffRole(str, Enum):
    OWNER = "Owner"
    DIRECTOR = "Director"
    MANAGER = "Manager"
    ADMIN = "Admin"
    TEACHER = "Teacher"
    ASSISTANT = "Assistant"

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

def generate_demo_data():
    """Generate demo data and populate in-memory databases"""
    global organizations_db, campuses_db, users_db, audit_logs_db
    global students_db, families_db, parents_db, staff_db, grade_records_db
    global behavior_notes_db, attendance_records_db, ixl_summaries_db
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
    
    from .demo_data import generate_all_demo_data
    
    data = generate_all_demo_data()
    organizations_db = data.get("organizations", [])
    campuses_db = data.get("campuses", [])
    users_db = data.get("users", [])
    audit_logs_db = data.get("audit_logs", [])
    students_db = data["students"]
    families_db = data["families"]
    parents_db = data["parents"]
    staff_db = data["staff"]
    grade_records_db = data["grade_records"]
    behavior_notes_db = data["behavior_notes"]
    attendance_records_db = data["attendance_records"]
    ixl_summaries_db = data["ixl_summaries"]
    billing_records_db = data["billing_records"]
    conferences_db = data["conferences"]
    messages_db = data["messages"]
    events_db = data["events"]
    event_rsvps_db = data["event_rsvps"]
    documents_db = data["documents"]
    document_signatures_db = data["document_signatures"]
    products_db = data["products"]
    orders_db = data["orders"]
    photo_albums_db = data["photo_albums"]
    incidents_db = data["incidents"]
    health_records_db = data["health_records"]
    invoices_db = data.get("invoices", [])
    invoice_line_items_db = data.get("invoice_line_items", [])
    payment_plans_db = data.get("payment_plans", [])
    payment_schedules_db = data.get("payment_schedules", [])
    leads_db = data.get("leads", [])
    campus_capacity_db = data.get("campus_capacity", [])
    message_templates_db = data.get("message_templates", [])
    broadcast_messages_db = data.get("broadcast_messages", [])
    automated_alerts_db = data.get("automated_alerts", [])
    academic_standards_db = data.get("academic_standards", [])
    standard_assessments_db = data.get("standard_assessments", [])
    progress_reports_db = data.get("progress_reports", [])
    iep_504_plans_db = data.get("iep_504_plans", [])
    accommodations_db = data.get("accommodations", [])
    iep_goals_db = data.get("iep_goals", [])
    intervention_plans_db = data.get("intervention_plans", [])
    intervention_progress_db = data.get("intervention_progress", [])
    at_risk_assessments_db = data.get("at_risk_assessments", [])
    retention_predictions_db = data.get("retention_predictions", [])
    enrollment_forecasts_db = data.get("enrollment_forecasts", [])
    assignments_db = data.get("assignments", [])
    grade_entries_db = data.get("grade_entries", [])
    announcements_db = data.get("announcements", [])
    announcement_reads_db = data.get("announcement_reads", [])
    event_workflows_db = data.get("event_workflows", [])

@app.on_event("startup")
async def startup_event():
    generate_demo_data()

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
    
    family.student_ids.append(student.student_id)
    
    return student

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

@app.get("/api/parents", response_model=List[Parent])
async def get_parents():
    return parents_db

@app.get("/api/parents/{parent_id}", response_model=Parent)
async def get_parent(parent_id: str):
    parent = next((p for p in parents_db if p.parent_id == parent_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent

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

@app.get("/api/behavior/{student_id}", response_model=List[BehaviorNote])
async def get_behavior_notes(student_id: str):
    return [b for b in behavior_notes_db if b.student_id == student_id]

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
            created_records.append(existing)
        else:
            attendance_id = f"att_{len(attendance_records_db) + 1}"
            new_record = AttendanceRecord(
                attendance_id=attendance_id,
                student_id=submission.student_id,
                date=today,
                status=submission.status,
                session=submission.session
            )
            attendance_records_db.append(new_record)
            created_records.append(new_record)
            
            if submission.status == AttendanceStatus.PRESENT:
                student.attendance_present_count += 1
            elif submission.status == AttendanceStatus.ABSENT:
                student.attendance_absent_count += 1
            elif submission.status == AttendanceStatus.TARDY:
                student.attendance_tardy_count += 1
    
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

@app.get("/api/billing/{family_id}", response_model=List[BillingRecord])
async def get_billing_records(family_id: str):
    return [b for b in billing_records_db if b.family_id == family_id]

@app.get("/api/conferences", response_model=List[Conference])
async def get_conferences(student_id: Optional[str] = None, parent_id: Optional[str] = None):
    conferences = conferences_db
    if student_id:
        conferences = [c for c in conferences if c.student_id == student_id]
    if parent_id:
        conferences = [c for c in conferences if c.parent_id == parent_id]
    return conferences

@app.get("/api/messages", response_model=List[Message])
async def get_messages(parent_id: Optional[str] = None, staff_id: Optional[str] = None):
    messages = messages_db
    if parent_id:
        messages = [m for m in messages if m.sender_id == parent_id or m.recipient_id == parent_id]
    if staff_id:
        messages = [m for m in messages if m.sender_id == staff_id or m.recipient_id == staff_id]
    return messages

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

@app.get("/api/rsvps")
async def get_rsvps(family_id: Optional[str] = None):
    if family_id:
        return [r for r in event_rsvps_db if r.family_id == family_id]
    return event_rsvps_db

@app.post("/api/rsvps")
async def create_rsvp(rsvp: EventRSVP):
    event_rsvps_db.append(rsvp)
    return rsvp

@app.put("/api/rsvps/{rsvp_id}")
async def update_rsvp(rsvp_id: str, status: RSVPStatus):
    rsvp = next((r for r in event_rsvps_db if r.rsvp_id == rsvp_id), None)
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    rsvp.status = status
    rsvp.response_date = datetime.now()
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
    return order

@app.put("/api/orders/{order_id}")
async def update_order(order_id: str, status: OrderStatus):
    order = next((o for o in orders_db if o.order_id == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status
    if status == OrderStatus.PAID:
        order.payment_date = datetime.now()
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
    invoice_counter = len(invoices_db) + 1
    
    for family in families:
        campus = next(c for c in campuses_db if any(s.campus_id == c.campus_id for s in students_db if s.family_id == family.family_id))
        family_students = [s for s in students_db if s.family_id == family.family_id]
        
        invoice_id = f"inv_{invoice_counter}"
        invoice_number = f"INV-{invoice_date.year}-{invoice_date.month:02d}-{invoice_counter:04d}"
        
        subtotal = 0.0
        line_items = []
        
        for student in family_students:
            monthly_tuition = family.monthly_tuition_amount / len(family_students)
            line_item = InvoiceLineItem(
                line_item_id=f"line_{invoice_counter}_{student.student_id}",
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
        invoice_line_items_db.extend(line_items)
        generated_invoices.append(invoice)
        invoice_counter += 1
    
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
    return plan

@app.put("/api/payment-plans/{payment_plan_id}")
async def update_payment_plan(payment_plan_id: str, plan: PaymentPlan):
    """Update an existing payment plan"""
    existing = next((p for p in payment_plans_db if p.payment_plan_id == payment_plan_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Payment plan not found")
    
    payment_plans_db.remove(existing)
    payment_plans_db.append(plan)
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
    return lead

@app.put("/api/admissions/leads/{lead_id}")
async def update_lead(lead_id: str, lead: Lead):
    """Update an existing lead"""
    index = next((i for i, l in enumerate(leads_db) if l.lead_id == lead_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    leads_db[index] = lead
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
    return template

@app.put("/api/communications/templates/{template_id}")
async def update_message_template(template_id: str, template: MessageTemplate):
    """Update an existing message template"""
    index = next((i for i, t in enumerate(message_templates_db) if t.template_id == template_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Template not found")
    message_templates_db[index] = template
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
    return broadcast

@app.put("/api/communications/broadcasts/{broadcast_id}")
async def update_broadcast_message(broadcast_id: str, broadcast: BroadcastMessage):
    """Update an existing broadcast message"""
    index = next((i for i, b in enumerate(broadcast_messages_db) if b.broadcast_id == broadcast_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    broadcast_messages_db[index] = broadcast
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
    return assessment

@app.put("/api/academics/assessments/{assessment_id}")
async def update_standard_assessment(assessment_id: str, assessment: StandardAssessment):
    """Update an existing standard assessment"""
    index = next((i for i, a in enumerate(standard_assessments_db) if a.assessment_id == assessment_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    standard_assessments_db[index] = assessment
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
    return plans

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
    return assessments

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
    return predictions

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
    return assignment

@app.put("/api/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, assignment: Assignment):
    for i, a in enumerate(assignments_db):
        if a.assignment_id == assignment_id:
            assignments_db[i] = assignment
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
    return entry

@app.put("/api/grade-entries/{entry_id}")
async def update_grade_entry(entry_id: str, entry: GradeEntry):
    for i, g in enumerate(grade_entries_db):
        if g.entry_id == entry_id:
            grade_entries_db[i] = entry
            return entry
    raise HTTPException(status_code=404, detail="Grade entry not found")

@app.post("/api/grade-entries/bulk")
async def bulk_create_grade_entries(entries: List[GradeEntry]):
    grade_entries_db.extend(entries)
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
    return announcement

@app.put("/api/announcements/{announcement_id}")
async def update_announcement(announcement_id: str, announcement: Announcement):
    for i, a in enumerate(announcements_db):
        if a.announcement_id == announcement_id:
            announcements_db[i] = announcement
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
            return announcements_db[i]
    raise HTTPException(status_code=404, detail="Announcement not found")

@app.post("/api/announcements/{announcement_id}/read")
async def mark_announcement_read(announcement_id: str, user_id: str):
    read_record = AnnouncementRead(
        read_id=f"read_{len(announcement_reads_db) + 1}",
        announcement_id=announcement_id,
        user_id=user_id,
        read_date=date.today()
    )
    announcement_reads_db.append(read_record)
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
    return workflow

@app.put("/api/event-workflows/{workflow_id}")
async def update_event_workflow(workflow_id: str, workflow: EventWorkflow):
    for i, w in enumerate(event_workflows_db):
        if w.workflow_id == workflow_id:
            event_workflows_db[i] = workflow
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
            return event_workflows_db[i]
    raise HTTPException(status_code=404, detail="Workflow not found")
