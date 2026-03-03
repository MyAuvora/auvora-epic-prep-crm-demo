"""
SQLAlchemy models for EPIC CRM
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey, Enum as SQLEnum
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


class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    campus_id = Column(String, ForeignKey("campuses.campus_id"))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date)
    grade = Column(String)
    session = Column(String)  # Morning/Afternoon
    room = Column(String)
    status = Column(String, default="Active")  # Active/Waitlisted/Withdrawn
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
    billing_status = Column(String, default="Green")  # Green/Yellow/Red
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
    relationship_type = Column(String)  # Mother/Father/Guardian
    primary_guardian = Column(Boolean, default=False)
    preferred_contact_method = Column(String, default="Email")
    
    family = relationship("Family", back_populates="parents")


class Staff(Base):
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String, unique=True, index=True)
    campus_id = Column(String, ForeignKey("campuses.campus_id"))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String)  # Owner/Director/Manager/Admin/Teacher/Assistant
    email = Column(String)
    phone = Column(String)
    assigned_rooms = Column(String)  # JSON string of room assignments
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
    status = Column(String)  # Present/Absent/Tardy
    session = Column(String)  # Morning/Afternoon
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
    type = Column(String)  # Positive/Concern
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
    allergies = Column(Text)  # JSON string
    medications = Column(Text)  # JSON string
    medical_conditions = Column(Text)  # JSON string
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
    type = Column(String)  # Charge/Payment
    description = Column(String)
    amount = Column(Float)
    source = Column(String)  # Step-Up/Out-of-Pocket
    period_month = Column(String)
    category = Column(String)  # Tuition/Fee/Store/Other
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
    status = Column(String, default="Draft")  # Draft/Sent/Paid/Overdue/Cancelled
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


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True)
    sender_type = Column(String)  # Parent/Staff
    sender_id = Column(String)
    recipient_type = Column(String)
    recipient_id = Column(String)
    student_id = Column(String)
    subject = Column(String)
    content = Column(Text)
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
    priority = Column(String, default="Normal")
    status = Column(String, default="Draft")
    publish_date = Column(DateTime)
    expiry_date = Column(DateTime)
    created_by = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)
    target_audience = Column(String)  # All/Parents/Staff/Grade-specific


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
    items = Column(Text)  # JSON string
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


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String, unique=True, index=True)
    user_id = Column(String)
    campus_id = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    action = Column(String)
    before_data = Column(Text)  # JSON string
    after_data = Column(Text)  # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)
