"""
SQLAlchemy models for EPIC CRM
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, date
from .database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    created_date = Column(Date, default=date.today)
    campuses = relationship("Campus", back_populates="organization")


class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, index=True)
    campus_id = Column(String, unique=True, index=True)
    organization_id = Column(String, ForeignKey("organizations.organization_id"))
    name = Column(String, nullable=False)
    location = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    active = Column(Boolean, default=True)
    organization = relationship("Organization", back_populates="campuses")
    students = relationship("Student", back_populates="campus")
    staff = relationship("Staff", back_populates="campus")
    families = relationship("Family", back_populates="campus")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    email = Column(String)
    password_hash = Column(String)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String)
    campus_ids = Column(Text)
    active = Column(Boolean, default=True)
    created_date = Column(Date, default=date.today)
    last_login = Column(DateTime)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    campus_id = Column(String, ForeignKey("campuses.campus_id"))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date)
    grade = Column(String)
    session = Column(String)
    room = Column(String)
    status = Column(String, default="Active")
    family_id = Column(String, ForeignKey("families.family_id"))
    enrollment_start_date = Column(Date)
    enrollment_end_date = Column(Date)
    attendance_present_count = Column(Integer, default=0)
    attendance_absent_count = Column(Integer, default=0)
    attendance_tardy_count = Column(Integer, default=0)
    overall_grade_flag = Column(String, default="On track")
    ixl_status_flag = Column(String, default="On track")
    overall_risk_flag = Column(String, default="None")
    funding_source = Column(String, default="Out-of-Pocket")
    step_up_percentage = Column(Integer, default=0)
    campus = relationship("Campus", back_populates="students")
    family = relationship("Family", back_populates="students")
    attendance_records = relationship("AttendanceRecord", back_populates="student")
    grade_records = relationship("GradeRecord", back_populates="student")
    behavior_notes = relationship("BehaviorNote", back_populates="student")
    health_record = relationship("HealthRecord", back_populates="student", uselist=False)


class Family(Base):
    __tablename__ = "families"

    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(String, unique=True, index=True)
    campus_id = Column(String, ForeignKey("campuses.campus_id"))
    family_name = Column(String, nullable=False)
    primary_parent_id = Column(String)
    monthly_tuition_amount = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    billing_status = Column(String, default="Green")
    last_payment_date = Column(Date)
    last_payment_amount = Column(Float)
    campus = relationship("Campus", back_populates="families")
    students = relationship("Student", back_populates="family")
    parents = relationship("Parent", back_populates="family")
    billing_records = relationship("BillingRecord", back_populates="family")
    invoices = relationship("Invoice", back_populates="family")


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(String, unique=True, index=True)
    family_id = Column(String, ForeignKey("families.family_id"))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    relationship_type = Column(String)
    primary_guardian = Column(Boolean, default=False)
    preferred_contact_method = Column(String, default="Email")
    family = relationship("Family", back_populates="parents")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String, unique=True, index=True)
    campus_id = Column(String, ForeignKey("campuses.campus_id"))
    campus_ids = Column(Text)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String)
    email = Column(String)
    phone = Column(String)
    assigned_rooms = Column(Text)
    permissions = Column(String)
    active = Column(Boolean, default=True)
    hire_date = Column(Date)
    campus = relationship("Campus", back_populates="staff")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    attendance_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    student_id = Column(String, ForeignKey("students.student_id"))
    date = Column(Date, nullable=False)
    status = Column(String)
    session = Column(String)
    notes = Column(Text)
    recorded_by = Column(String)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    student = relationship("Student", back_populates="attendance_records")


class GradeRecord(Base):
    __tablename__ = "grade_records"

    id = Column(Integer, primary_key=True, index=True)
    grade_record_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    student_id = Column(String, ForeignKey("students.student_id"))
    subject = Column(String)
    term = Column(String)
    grade_value = Column(String)
    grade_percentage = Column(Float)
    is_failing = Column(Boolean, default=False)
    recorded_date = Column(Date)
    student = relationship("Student", back_populates="grade_records")


class BehaviorNote(Base):
    __tablename__ = "behavior_notes"

    id = Column(Integer, primary_key=True, index=True)
    behavior_note_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    student_id = Column(String, ForeignKey("students.student_id"))
    date = Column(Date, nullable=False)
    type = Column(String)
    summary = Column(Text)
    flag_for_followup = Column(Boolean, default=False)
    recorded_by = Column(String)
    student = relationship("Student", back_populates="behavior_notes")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    health_record_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    student_id = Column(String, ForeignKey("students.student_id"), unique=True)
    allergies = Column(Text)
    medications = Column(Text)
    medical_conditions = Column(Text)
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    emergency_contact_relationship = Column(String)
    physician_name = Column(String)
    physician_phone = Column(String)
    last_updated = Column(Date)
    student = relationship("Student", back_populates="health_record")


class BillingRecord(Base):
    __tablename__ = "billing_records"

    id = Column(Integer, primary_key=True, index=True)
    billing_record_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    family_id = Column(String, ForeignKey("families.family_id"))
    date = Column(Date, nullable=False)
    type = Column(String)
    description = Column(String)
    amount = Column(Float)
    source = Column(String)
    period_month = Column(String)
    category = Column(String)
    student_id = Column(String)
    family = relationship("Family", back_populates="billing_records")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    family_id = Column(String, ForeignKey("families.family_id"))
    invoice_number = Column(String)
    invoice_date = Column(Date)
    due_date = Column(Date)
    status = Column(String, default="Draft")
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    amount_paid = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    notes = Column(Text)
    created_date = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    family = relationship("Family", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice")


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(Integer, primary_key=True, index=True)
    line_item_id = Column(String, unique=True, index=True)
    invoice_id = Column(String, ForeignKey("invoices.invoice_id"))
    description = Column(String)
    category = Column(String)
    student_id = Column(String)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)
    total = Column(Float)
    funding_source = Column(String)
    invoice = relationship("Invoice", back_populates="line_items")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    parent_first_name = Column(String)
    parent_last_name = Column(String)
    email = Column(String)
    phone = Column(String)
    child_first_name = Column(String)
    child_last_name = Column(String)
    child_dob = Column(Date)
    desired_grade = Column(String)
    desired_start_date = Column(Date)
    stage = Column(String, default="New Inquiry")
    source = Column(String)
    created_date = Column(Date, default=date.today)
    last_contact_date = Column(Date)
    tour_date = Column(Date)
    notes = Column(Text)
    assigned_to = Column(String)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    title = Column(String, nullable=False)
    description = Column(Text)
    event_type = Column(String)
    date = Column(Date)
    time = Column(String)
    location = Column(String)
    requires_rsvp = Column(Boolean, default=False)
    requires_permission_slip = Column(Boolean, default=False)
    requires_payment = Column(Boolean, default=False)
    payment_amount = Column(Float)
    created_by_staff_id = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)


class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id = Column(Integer, primary_key=True, index=True)
    rsvp_id = Column(String, unique=True, index=True)
    event_id = Column(String)
    family_id = Column(String)
    parent_id = Column(String)
    student_ids = Column(Text)
    status = Column(String, default="Pending")
    response_date = Column(DateTime)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True)
    sender_type = Column(String)
    sender_id = Column(String)
    recipient_type = Column(String)
    recipient_id = Column(String)
    student_id = Column(String)
    subject = Column(String)
    content = Column(Text)
    content_preview = Column(String)
    read = Column(Boolean, default=False)
    date_time = Column(DateTime, default=datetime.utcnow)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    title = Column(String, nullable=False)
    content = Column(Text)
    category = Column(String)
    status = Column(String, default="Draft")
    created_by = Column(String)
    created_by_role = Column(String)
    approved_by = Column(String)
    approved_date = Column(Date)
    published_date = Column(Date)
    expires_date = Column(Date)
    is_pinned = Column(Boolean, default=False)
    target_roles = Column(Text)
    priority = Column(String, default="Normal")
    publish_date = Column(DateTime)
    expiry_date = Column(DateTime)
    created_date = Column(DateTime, default=datetime.utcnow)
    target_audience = Column(String)


class AnnouncementRead(Base):
    __tablename__ = "announcement_reads"

    id = Column(Integer, primary_key=True, index=True)
    read_id = Column(String, unique=True, index=True)
    announcement_id = Column(String)
    user_id = Column(String)
    read_date = Column(Date)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    price = Column(Float)
    image_url = Column(String)
    available = Column(Boolean, default=True)
    inventory_count = Column(Integer, default=0)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    family_id = Column(String)
    parent_id = Column(String)
    items = Column(Text)
    total_amount = Column(Float)
    status = Column(String, default="Pending")
    order_date = Column(DateTime, default=datetime.utcnow)
    payment_date = Column(DateTime)


class Conference(Base):
    __tablename__ = "conferences"

    id = Column(Integer, primary_key=True, index=True)
    conference_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    parent_id = Column(String)
    staff_id = Column(String)
    date_time = Column(DateTime)
    location = Column(String)
    status = Column(String, default="Scheduled")
    notes = Column(Text)
    created_date = Column(DateTime, default=datetime.utcnow)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    student_id = Column(String)
    reported_by_staff_id = Column(String)
    incident_type = Column(String)
    severity = Column(String)
    date = Column(Date)
    time = Column(String)
    description = Column(Text)
    action_taken = Column(Text)
    parent_notified = Column(Boolean, default=False)
    followup_required = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    title = Column(String, nullable=False)
    document_type = Column(String)
    description = Column(Text)
    required_for = Column(String)
    status = Column(String, default="Pending")
    created_date = Column(Date, default=date.today)
    expiration_date = Column(Date)
    file_url = Column(String)


class DocumentSignature(Base):
    __tablename__ = "document_signatures"

    id = Column(Integer, primary_key=True, index=True)
    signature_id = Column(String, unique=True, index=True)
    document_id = Column(String)
    parent_id = Column(String)
    student_id = Column(String)
    signed_date = Column(DateTime)
    signature_data = Column(Text)


class PhotoAlbum(Base):
    __tablename__ = "photo_albums"

    id = Column(Integer, primary_key=True, index=True)
    album_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    title = Column(String, nullable=False)
    description = Column(Text)
    created_by_staff_id = Column(String)
    created_date = Column(Date, default=date.today)
    status = Column(String, default="Draft")
    photo_urls = Column(Text)
    visible_to_grades = Column(Text)


class PaymentPlan(Base):
    __tablename__ = "payment_plans"

    id = Column(Integer, primary_key=True, index=True)
    payment_plan_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    family_id = Column(String)
    plan_name = Column(String)
    total_amount = Column(Float)
    amount_paid = Column(Float, default=0.0)
    balance = Column(Float)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String, default="Active")
    created_date = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)


class PaymentSchedule(Base):
    __tablename__ = "payment_schedules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(String, unique=True, index=True)
    payment_plan_id = Column(String)
    installment_number = Column(Integer)
    due_date = Column(Date)
    amount = Column(Float)
    paid = Column(Boolean, default=False)
    paid_date = Column(Date)
    paid_amount = Column(Float, default=0.0)


class CampusCapacity(Base):
    __tablename__ = "campus_capacity"

    id = Column(Integer, primary_key=True, index=True)
    campus_id = Column(String)
    grade = Column(String)
    session = Column(String)
    total_capacity = Column(Integer)
    current_enrollment = Column(Integer, default=0)
    waitlist_count = Column(Integer, default=0)


class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(String, unique=True, index=True)
    name = Column(String)
    trigger_type = Column(String)
    communication_type = Column(String)
    subject = Column(String)
    body = Column(Text)
    active = Column(Boolean, default=True)
    created_date = Column(Date, default=date.today)


class BroadcastMessage(Base):
    __tablename__ = "broadcast_messages"

    id = Column(Integer, primary_key=True, index=True)
    broadcast_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    sender_id = Column(String)
    communication_type = Column(String)
    subject = Column(String)
    body = Column(Text)
    recipient_type = Column(String)
    recipient_count = Column(Integer, default=0)
    status = Column(String, default="Draft")
    scheduled_date = Column(DateTime)
    sent_date = Column(DateTime)
    created_date = Column(Date, default=date.today)


class AutomatedAlert(Base):
    __tablename__ = "automated_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True)
    trigger_type = Column(String)
    student_id = Column(String)
    family_id = Column(String)
    triggered_date = Column(Date)
    message_sent = Column(Boolean, default=False)
    message_content = Column(Text)
    communication_type = Column(String)


class AcademicStandard(Base):
    __tablename__ = "academic_standards"

    id = Column(Integer, primary_key=True, index=True)
    standard_id = Column(String, unique=True, index=True)
    subject = Column(String)
    grade = Column(String)
    code = Column(String)
    description = Column(Text)
    category = Column(String)


class StandardAssessment(Base):
    __tablename__ = "standard_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    standard_id = Column(String)
    mastery_level = Column(String)
    assessment_date = Column(Date)
    notes = Column(Text)
    teacher_id = Column(String)


class ProgressReport(Base):
    __tablename__ = "progress_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    term = Column(String)
    generated_date = Column(Date)
    standards_assessed = Column(Integer, default=0)
    proficient_count = Column(Integer, default=0)
    developing_count = Column(Integer, default=0)
    beginning_count = Column(Integer, default=0)
    overall_progress = Column(String)


class IEP504Plan(Base):
    __tablename__ = "iep_504_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    campus_id = Column(String)
    plan_type = Column(String)
    status = Column(String, default="Draft")
    start_date = Column(Date)
    end_date = Column(Date)
    case_manager = Column(String)
    disability_category = Column(String)
    meeting_date = Column(Date)
    next_review_date = Column(Date)
    parent_consent_date = Column(Date)
    notes = Column(Text)


class Accommodation(Base):
    __tablename__ = "accommodations"

    id = Column(Integer, primary_key=True, index=True)
    accommodation_id = Column(String, unique=True, index=True)
    plan_id = Column(String)
    type = Column(String)
    description = Column(Text)
    frequency = Column(String)
    responsible_staff = Column(String)
    implementation_notes = Column(Text)


class IEPGoal(Base):
    __tablename__ = "iep_goals"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(String, unique=True, index=True)
    plan_id = Column(String)
    area = Column(String)
    goal_description = Column(Text)
    baseline = Column(String)
    target = Column(String)
    target_date = Column(Date)
    status = Column(String, default="Not Started")
    progress_percentage = Column(Integer, default=0)
    last_updated = Column(Date)


class InterventionPlan(Base):
    __tablename__ = "intervention_plans"

    id = Column(Integer, primary_key=True, index=True)
    intervention_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    campus_id = Column(String)
    tier = Column(String)
    area_of_concern = Column(String)
    intervention_strategy = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    frequency = Column(String)
    duration_minutes = Column(Integer)
    staff_responsible = Column(String)
    status = Column(String, default="Active")
    baseline_data = Column(String)
    target_goal = Column(String)


class InterventionProgress(Base):
    __tablename__ = "intervention_progress"

    id = Column(Integer, primary_key=True, index=True)
    progress_id = Column(String, unique=True, index=True)
    intervention_id = Column(String)
    date = Column(Date)
    data_point = Column(Float)
    notes = Column(Text)
    staff_id = Column(String)


class AtRiskAssessment(Base):
    __tablename__ = "at_risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    campus_id = Column(String)
    assessment_date = Column(Date)
    overall_risk_score = Column(Integer)
    overall_risk_level = Column(String)
    academic_score = Column(Integer)
    attendance_score = Column(Integer)
    behavior_score = Column(Integer)
    engagement_score = Column(Integer)
    risk_factors = Column(Text)
    recommended_interventions = Column(Text)
    assessed_by = Column(String)


class RetentionPrediction(Base):
    __tablename__ = "retention_predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    campus_id = Column(String)
    school_year = Column(String)
    retention_probability = Column(Float)
    risk_level = Column(String)
    key_factors = Column(Text)
    recommended_actions = Column(Text)
    last_updated = Column(Date)


class EnrollmentForecast(Base):
    __tablename__ = "enrollment_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    forecast_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    school_year = Column(String)
    grade_level = Column(String)
    forecasted_enrollment = Column(Integer)
    confidence_interval_low = Column(Integer)
    confidence_interval_high = Column(Integer)
    based_on_factors = Column(Text)
    generated_date = Column(Date)


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    teacher_id = Column(String)
    room = Column(String)
    subject = Column(String)
    assignment_type = Column(String)
    title = Column(String, nullable=False)
    description = Column(Text)
    max_points = Column(Integer)
    due_date = Column(Date)
    status = Column(String, default="Draft")
    created_date = Column(Date, default=date.today)


class GradeEntry(Base):
    __tablename__ = "grade_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(String, unique=True, index=True)
    assignment_id = Column(String)
    student_id = Column(String)
    campus_id = Column(String)
    points_earned = Column(Integer)
    letter_grade = Column(String)
    percentage = Column(Float)
    status = Column(String, default="Missing")
    comment = Column(Text)
    submitted_date = Column(Date)
    graded_date = Column(Date)
    graded_by = Column(String)


class EventWorkflow(Base):
    __tablename__ = "event_workflows"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(String, unique=True, index=True)
    event_id = Column(String)
    rsvp_id = Column(String)
    family_id = Column(String)
    student_id = Column(String)
    status = Column(String, default="Pending")
    permission_slip_signed = Column(Boolean, default=False)
    permission_slip_signature_id = Column(String)
    payment_complete = Column(Boolean, default=False)
    payment_order_id = Column(String)
    created_date = Column(Date, default=date.today)
    completed_date = Column(Date)


class IXLSummary(Base):
    __tablename__ = "ixl_summaries"

    id = Column(Integer, primary_key=True, index=True)
    ixl_summary_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    week_start_date = Column(Date)
    weekly_hours = Column(Float, default=0.0)
    skills_practiced_this_week = Column(Integer, default=0)
    skills_mastered_total = Column(Integer, default=0)
    math_proficiency = Column(String, default="On track")
    ela_proficiency = Column(String, default="On track")
    last_active_date = Column(Date)
    recent_skills = Column(Text)


class AcellusCourse(Base):
    __tablename__ = "acellus_courses"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    course_name = Column(String)
    subject = Column(String)
    total_steps = Column(Integer, default=0)
    completed_steps = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    current_grade = Column(String)
    grade_percentage = Column(Float, default=0.0)
    status = Column(String, default="On track")
    last_activity_date = Column(Date)
    time_spent_hours = Column(Float, default=0.0)


class AcellusSummary(Base):
    __tablename__ = "acellus_summaries"

    id = Column(Integer, primary_key=True, index=True)
    acellus_summary_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    total_courses = Column(Integer, default=0)
    courses_on_track = Column(Integer, default=0)
    courses_behind = Column(Integer, default=0)
    overall_gpa = Column(Float, default=0.0)
    total_time_spent_hours = Column(Float, default=0.0)
    last_active_date = Column(Date)
    overall_status = Column(String, default="On track")


class SUFSScholarship(Base):
    __tablename__ = "sufs_scholarships"

    id = Column(Integer, primary_key=True, index=True)
    scholarship_id = Column(String, unique=True, index=True)
    student_id = Column(String)
    family_id = Column(String)
    campus_id = Column(String)
    scholarship_type = Column(String)
    award_id = Column(String)
    school_year = Column(String)
    annual_award_amount = Column(Float)
    quarterly_amount = Column(Float)
    remaining_balance = Column(Float)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String, default="Active")
    eligibility_verified = Column(Boolean, default=False)
    eligibility_verified_date = Column(Date)
    notes = Column(Text)
    created_date = Column(Date, default=date.today)
    last_updated = Column(Date)


class SUFSClaim(Base):
    __tablename__ = "sufs_claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String, unique=True, index=True)
    scholarship_id = Column(String)
    student_id = Column(String)
    family_id = Column(String)
    campus_id = Column(String)
    claim_period = Column(String)
    claim_date = Column(Date)
    amount_claimed = Column(Float)
    tuition_amount = Column(Float)
    fees_amount = Column(Float)
    status = Column(String, default="Draft")
    submitted_date = Column(Date)
    approved_date = Column(Date)
    paid_date = Column(Date)
    paid_amount = Column(Float)
    denial_reason = Column(String)
    sufs_reference_number = Column(String)
    notes = Column(Text)
    created_date = Column(Date, default=date.today)
    last_updated = Column(Date)


class SUFSPayment(Base):
    __tablename__ = "sufs_payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String, unique=True, index=True)
    campus_id = Column(String)
    payment_date = Column(Date)
    deposit_date = Column(Date)
    total_amount = Column(Float)
    sufs_reference_number = Column(String)
    bank_reference = Column(String)
    status = Column(String, default="Pending")
    reconciled_date = Column(Date)
    reconciled_by = Column(String)
    notes = Column(Text)
    created_date = Column(Date, default=date.today)


class SUFSPaymentAllocation(Base):
    __tablename__ = "sufs_payment_allocations"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(String, unique=True, index=True)
    payment_id = Column(String)
    claim_id = Column(String)
    student_id = Column(String)
    family_id = Column(String)
    amount = Column(Float)
    status = Column(String)
    discrepancy_amount = Column(Float)
    discrepancy_reason = Column(String)
    created_date = Column(Date, default=date.today)


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    payment_method_id = Column(String, unique=True, index=True)
    family_id = Column(String)
    type = Column(String)
    last_four = Column(String)
    brand = Column(String)
    exp_month = Column(Integer)
    exp_year = Column(Integer)
    is_default = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String, unique=True, index=True)
    user_id = Column(String)
    campus_id = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    action = Column(String)
    before_data = Column(Text)
    after_data = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)

