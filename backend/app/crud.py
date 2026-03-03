"""
CRUD operations for EPIC CRM database
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, datetime
import uuid
import json

from . import models


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix"""
    return f"{prefix}{uuid.uuid4().hex[:8]}"


# Organization CRUD
def create_organization(db: Session, name: str) -> models.Organization:
    org = models.Organization(
        organization_id=generate_id("org_"),
        name=name,
        created_date=date.today()
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def get_organization(db: Session, organization_id: str) -> Optional[models.Organization]:
    return db.query(models.Organization).filter(
        models.Organization.organization_id == organization_id
    ).first()


# Campus CRUD
def create_campus(db: Session, organization_id: str, name: str, location: str, 
                  address: str = None, phone: str = None, email: str = None) -> models.Campus:
    campus = models.Campus(
        campus_id=generate_id("campus_"),
        organization_id=organization_id,
        name=name,
        location=location,
        address=address,
        phone=phone,
        email=email,
        active=True
    )
    db.add(campus)
    db.commit()
    db.refresh(campus)
    return campus


def get_campus(db: Session, campus_id: str) -> Optional[models.Campus]:
    return db.query(models.Campus).filter(models.Campus.campus_id == campus_id).first()


def get_all_campuses(db: Session, organization_id: str = None) -> List[models.Campus]:
    query = db.query(models.Campus)
    if organization_id:
        query = query.filter(models.Campus.organization_id == organization_id)
    return query.all()


# Student CRUD
def create_student(db: Session, campus_id: str, first_name: str, last_name: str,
                   date_of_birth: date, grade: str, session: str, room: str,
                   family_id: str, enrollment_start_date: date,
                   funding_source: str = "Out-of-Pocket", step_up_percentage: int = 0) -> models.Student:
    student = models.Student(
        student_id=generate_id("stu_"),
        campus_id=campus_id,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
        grade=grade,
        session=session,
        room=room,
        status="Active",
        family_id=family_id,
        enrollment_start_date=enrollment_start_date,
        funding_source=funding_source,
        step_up_percentage=step_up_percentage
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def get_student(db: Session, student_id: str) -> Optional[models.Student]:
    return db.query(models.Student).filter(models.Student.student_id == student_id).first()


def get_students_by_campus(db: Session, campus_id: str, status: str = None) -> List[models.Student]:
    query = db.query(models.Student).filter(models.Student.campus_id == campus_id)
    if status:
        query = query.filter(models.Student.status == status)
    return query.all()


def get_students_by_family(db: Session, family_id: str) -> List[models.Student]:
    return db.query(models.Student).filter(models.Student.family_id == family_id).all()


def update_student(db: Session, student_id: str, **kwargs) -> Optional[models.Student]:
    student = get_student(db, student_id)
    if student:
        for key, value in kwargs.items():
            if hasattr(student, key):
                setattr(student, key, value)
        db.commit()
        db.refresh(student)
    return student


def delete_student(db: Session, student_id: str) -> bool:
    student = get_student(db, student_id)
    if student:
        db.delete(student)
        db.commit()
        return True
    return False


# Family CRUD
def create_family(db: Session, campus_id: str, family_name: str, 
                  monthly_tuition_amount: float = 0.0) -> models.Family:
    family = models.Family(
        family_id=generate_id("fam_"),
        campus_id=campus_id,
        family_name=family_name,
        monthly_tuition_amount=monthly_tuition_amount,
        current_balance=0.0,
        billing_status="Green"
    )
    db.add(family)
    db.commit()
    db.refresh(family)
    return family


def get_family(db: Session, family_id: str) -> Optional[models.Family]:
    return db.query(models.Family).filter(models.Family.family_id == family_id).first()


def get_families_by_campus(db: Session, campus_id: str) -> List[models.Family]:
    return db.query(models.Family).filter(models.Family.campus_id == campus_id).all()


def update_family(db: Session, family_id: str, **kwargs) -> Optional[models.Family]:
    family = get_family(db, family_id)
    if family:
        for key, value in kwargs.items():
            if hasattr(family, key):
                setattr(family, key, value)
        db.commit()
        db.refresh(family)
    return family


# Parent CRUD
def create_parent(db: Session, family_id: str, first_name: str, last_name: str,
                  email: str, phone: str, relationship_type: str,
                  primary_guardian: bool = False) -> models.Parent:
    parent = models.Parent(
        parent_id=generate_id("par_"),
        family_id=family_id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        relationship_type=relationship_type,
        primary_guardian=primary_guardian
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)
    return parent


def get_parent(db: Session, parent_id: str) -> Optional[models.Parent]:
    return db.query(models.Parent).filter(models.Parent.parent_id == parent_id).first()


def get_parents_by_family(db: Session, family_id: str) -> List[models.Parent]:
    return db.query(models.Parent).filter(models.Parent.family_id == family_id).all()


# Staff CRUD
def create_staff(db: Session, campus_id: str, first_name: str, last_name: str,
                 role: str, email: str, phone: str = None,
                 assigned_rooms: List[str] = None) -> models.Staff:
    staff = models.Staff(
        staff_id=generate_id("staff_"),
        campus_id=campus_id,
        first_name=first_name,
        last_name=last_name,
        role=role,
        email=email,
        phone=phone,
        assigned_rooms=json.dumps(assigned_rooms or []),
        active=True,
        hire_date=date.today()
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


def get_staff(db: Session, staff_id: str) -> Optional[models.Staff]:
    return db.query(models.Staff).filter(models.Staff.staff_id == staff_id).first()


def get_staff_by_campus(db: Session, campus_id: str, active_only: bool = True) -> List[models.Staff]:
    query = db.query(models.Staff).filter(models.Staff.campus_id == campus_id)
    if active_only:
        query = query.filter(models.Staff.active == True)
    return query.all()


# Attendance CRUD
def create_attendance_record(db: Session, campus_id: str, student_id: str,
                             attendance_date: date, status: str, session: str,
                             recorded_by: str = None, notes: str = None) -> models.AttendanceRecord:
    record = models.AttendanceRecord(
        attendance_id=generate_id("att_"),
        campus_id=campus_id,
        student_id=student_id,
        date=attendance_date,
        status=status,
        session=session,
        recorded_by=recorded_by,
        notes=notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Update student attendance counts
    student = get_student(db, student_id)
    if student:
        if status == "Present":
            student.attendance_present_count += 1
        elif status == "Absent":
            student.attendance_absent_count += 1
        elif status == "Tardy":
            student.attendance_tardy_count += 1
        db.commit()
    
    return record


def get_attendance_by_student(db: Session, student_id: str, 
                               start_date: date = None, end_date: date = None) -> List[models.AttendanceRecord]:
    query = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.student_id == student_id
    )
    if start_date:
        query = query.filter(models.AttendanceRecord.date >= start_date)
    if end_date:
        query = query.filter(models.AttendanceRecord.date <= end_date)
    return query.order_by(models.AttendanceRecord.date.desc()).all()


def get_attendance_by_date(db: Session, campus_id: str, attendance_date: date,
                           session: str = None) -> List[models.AttendanceRecord]:
    query = db.query(models.AttendanceRecord).filter(
        and_(
            models.AttendanceRecord.campus_id == campus_id,
            models.AttendanceRecord.date == attendance_date
        )
    )
    if session:
        query = query.filter(models.AttendanceRecord.session == session)
    return query.all()


# Grade Record CRUD
def create_grade_record(db: Session, campus_id: str, student_id: str,
                        subject: str, term: str, grade_value: str,
                        grade_percentage: float = None) -> models.GradeRecord:
    is_failing = grade_percentage is not None and grade_percentage < 60
    record = models.GradeRecord(
        grade_record_id=generate_id("grade_"),
        campus_id=campus_id,
        student_id=student_id,
        subject=subject,
        term=term,
        grade_value=grade_value,
        grade_percentage=grade_percentage,
        is_failing=is_failing,
        recorded_date=date.today()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_grades_by_student(db: Session, student_id: str, term: str = None) -> List[models.GradeRecord]:
    query = db.query(models.GradeRecord).filter(
        models.GradeRecord.student_id == student_id
    )
    if term:
        query = query.filter(models.GradeRecord.term == term)
    return query.all()


# Billing Record CRUD
def create_billing_record(db: Session, campus_id: str, family_id: str,
                          record_date: date, record_type: str, description: str,
                          amount: float, source: str = None, category: str = None,
                          student_id: str = None, period_month: str = None) -> models.BillingRecord:
    record = models.BillingRecord(
        billing_record_id=generate_id("bill_"),
        campus_id=campus_id,
        family_id=family_id,
        date=record_date,
        type=record_type,
        description=description,
        amount=amount,
        source=source,
        category=category,
        student_id=student_id,
        period_month=period_month
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Update family balance
    family = get_family(db, family_id)
    if family:
        if record_type == "Charge":
            family.current_balance += amount
        elif record_type == "Payment":
            family.current_balance -= amount
            family.last_payment_date = record_date
            family.last_payment_amount = amount
        
        # Update billing status based on balance
        if family.current_balance <= 0:
            family.billing_status = "Green"
        elif family.current_balance <= family.monthly_tuition_amount:
            family.billing_status = "Yellow"
        else:
            family.billing_status = "Red"
        
        db.commit()
    
    return record


def get_billing_by_family(db: Session, family_id: str, 
                          start_date: date = None, end_date: date = None) -> List[models.BillingRecord]:
    query = db.query(models.BillingRecord).filter(
        models.BillingRecord.family_id == family_id
    )
    if start_date:
        query = query.filter(models.BillingRecord.date >= start_date)
    if end_date:
        query = query.filter(models.BillingRecord.date <= end_date)
    return query.order_by(models.BillingRecord.date.desc()).all()


# Lead CRUD
def create_lead(db: Session, campus_id: str, parent_first_name: str, parent_last_name: str,
                email: str, phone: str, child_first_name: str, child_last_name: str,
                child_dob: date, desired_grade: str, desired_start_date: date,
                source: str, notes: str = None) -> models.Lead:
    lead = models.Lead(
        lead_id=generate_id("lead_"),
        campus_id=campus_id,
        parent_first_name=parent_first_name,
        parent_last_name=parent_last_name,
        email=email,
        phone=phone,
        child_first_name=child_first_name,
        child_last_name=child_last_name,
        child_dob=child_dob,
        desired_grade=desired_grade,
        desired_start_date=desired_start_date,
        stage="New Inquiry",
        source=source,
        notes=notes
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def get_lead(db: Session, lead_id: str) -> Optional[models.Lead]:
    return db.query(models.Lead).filter(models.Lead.lead_id == lead_id).first()


def get_leads_by_campus(db: Session, campus_id: str, stage: str = None) -> List[models.Lead]:
    query = db.query(models.Lead).filter(models.Lead.campus_id == campus_id)
    if stage:
        query = query.filter(models.Lead.stage == stage)
    return query.order_by(models.Lead.created_date.desc()).all()


def update_lead(db: Session, lead_id: str, **kwargs) -> Optional[models.Lead]:
    lead = get_lead(db, lead_id)
    if lead:
        for key, value in kwargs.items():
            if hasattr(lead, key):
                setattr(lead, key, value)
        db.commit()
        db.refresh(lead)
    return lead


# Event CRUD
def create_event(db: Session, campus_id: str, title: str, description: str,
                 event_type: str, event_date: date, time: str, location: str,
                 created_by_staff_id: str, requires_rsvp: bool = False,
                 requires_permission_slip: bool = False, requires_payment: bool = False,
                 payment_amount: float = None) -> models.Event:
    event = models.Event(
        event_id=generate_id("evt_"),
        campus_id=campus_id,
        title=title,
        description=description,
        event_type=event_type,
        date=event_date,
        time=time,
        location=location,
        requires_rsvp=requires_rsvp,
        requires_permission_slip=requires_permission_slip,
        requires_payment=requires_payment,
        payment_amount=payment_amount,
        created_by_staff_id=created_by_staff_id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_events_by_campus(db: Session, campus_id: str, 
                         start_date: date = None, end_date: date = None) -> List[models.Event]:
    query = db.query(models.Event).filter(models.Event.campus_id == campus_id)
    if start_date:
        query = query.filter(models.Event.date >= start_date)
    if end_date:
        query = query.filter(models.Event.date <= end_date)
    return query.order_by(models.Event.date).all()


# Message CRUD
def create_message(db: Session, sender_type: str, sender_id: str,
                   recipient_type: str, recipient_id: str, subject: str,
                   content: str, student_id: str = None) -> models.Message:
    message = models.Message(
        message_id=generate_id("msg_"),
        sender_type=sender_type,
        sender_id=sender_id,
        recipient_type=recipient_type,
        recipient_id=recipient_id,
        student_id=student_id,
        subject=subject,
        content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_messages_for_user(db: Session, user_type: str, user_id: str,
                          unread_only: bool = False) -> List[models.Message]:
    query = db.query(models.Message).filter(
        and_(
            models.Message.recipient_type == user_type,
            models.Message.recipient_id == user_id
        )
    )
    if unread_only:
        query = query.filter(models.Message.read == False)
    return query.order_by(models.Message.date_time.desc()).all()


def mark_message_read(db: Session, message_id: str) -> Optional[models.Message]:
    message = db.query(models.Message).filter(
        models.Message.message_id == message_id
    ).first()
    if message:
        message.read = True
        db.commit()
        db.refresh(message)
    return message


# Announcement CRUD
def create_announcement(db: Session, campus_id: str, title: str, content: str,
                        category: str, created_by: str, priority: str = "Normal",
                        target_audience: str = "All", publish_date: datetime = None,
                        expiry_date: datetime = None) -> models.Announcement:
    announcement = models.Announcement(
        announcement_id=generate_id("ann_"),
        campus_id=campus_id,
        title=title,
        content=content,
        category=category,
        priority=priority,
        status="Draft" if not publish_date else "Published",
        publish_date=publish_date or datetime.utcnow(),
        expiry_date=expiry_date,
        created_by=created_by,
        target_audience=target_audience
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


def get_announcements_by_campus(db: Session, campus_id: str, 
                                 active_only: bool = True) -> List[models.Announcement]:
    query = db.query(models.Announcement).filter(
        models.Announcement.campus_id == campus_id
    )
    if active_only:
        query = query.filter(
            and_(
                models.Announcement.status == "Published",
                or_(
                    models.Announcement.expiry_date == None,
                    models.Announcement.expiry_date >= datetime.utcnow()
                )
            )
        )
    return query.order_by(models.Announcement.publish_date.desc()).all()


# Audit Log CRUD
def create_audit_log(db: Session, user_id: str, campus_id: str, entity_type: str,
                     entity_id: str, action: str, before_data: dict = None,
                     after_data: dict = None, ip_address: str = None) -> models.AuditLog:
    log = models.AuditLog(
        audit_id=generate_id("audit_"),
        user_id=user_id,
        campus_id=campus_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        before_data=json.dumps(before_data) if before_data else None,
        after_data=json.dumps(after_data) if after_data else None,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# Health Record CRUD
def create_health_record(db: Session, campus_id: str, student_id: str,
                         allergies: List[str] = None, medications: List[str] = None,
                         medical_conditions: List[str] = None,
                         emergency_contact_name: str = None,
                         emergency_contact_phone: str = None,
                         emergency_contact_relationship: str = None) -> models.HealthRecord:
    record = models.HealthRecord(
        health_record_id=generate_id("health_"),
        campus_id=campus_id,
        student_id=student_id,
        allergies=json.dumps(allergies or []),
        medications=json.dumps(medications or []),
        medical_conditions=json.dumps(medical_conditions or []),
        emergency_contact_name=emergency_contact_name,
        emergency_contact_phone=emergency_contact_phone,
        emergency_contact_relationship=emergency_contact_relationship,
        last_updated=date.today()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_health_record_by_student(db: Session, student_id: str) -> Optional[models.HealthRecord]:
    return db.query(models.HealthRecord).filter(
        models.HealthRecord.student_id == student_id
    ).first()


# Invoice CRUD
def create_invoice(db: Session, campus_id: str, family_id: str,
                   due_date: date, line_items: List[dict]) -> models.Invoice:
    # Calculate totals
    subtotal = sum(item.get('total', 0) for item in line_items)
    tax = 0  # No tax for education
    total = subtotal + tax
    
    # Generate invoice number
    invoice_count = db.query(models.Invoice).count()
    invoice_number = f"INV-{date.today().year}-{str(invoice_count + 1).zfill(5)}"
    
    invoice = models.Invoice(
        invoice_id=generate_id("inv_"),
        campus_id=campus_id,
        family_id=family_id,
        invoice_number=invoice_number,
        invoice_date=date.today(),
        due_date=due_date,
        status="Draft",
        subtotal=subtotal,
        tax=tax,
        total=total,
        amount_paid=0,
        balance=total
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    # Create line items
    for item in line_items:
        line_item = models.InvoiceLineItem(
            line_item_id=generate_id("line_"),
            invoice_id=invoice.invoice_id,
            description=item.get('description', ''),
            category=item.get('category', 'Other'),
            student_id=item.get('student_id'),
            quantity=item.get('quantity', 1),
            unit_price=item.get('unit_price', 0),
            total=item.get('total', 0),
            funding_source=item.get('funding_source')
        )
        db.add(line_item)
    
    db.commit()
    return invoice


def get_invoices_by_family(db: Session, family_id: str) -> List[models.Invoice]:
    return db.query(models.Invoice).filter(
        models.Invoice.family_id == family_id
    ).order_by(models.Invoice.invoice_date.desc()).all()


# Product CRUD
def create_product(db: Session, name: str, description: str, category: str,
                   price: float, image_url: str = None, inventory_count: int = 0) -> models.Product:
    product = models.Product(
        product_id=generate_id("prod_"),
        name=name,
        description=description,
        category=category,
        price=price,
        image_url=image_url,
        available=True,
        inventory_count=inventory_count
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_all_products(db: Session, available_only: bool = True) -> List[models.Product]:
    query = db.query(models.Product)
    if available_only:
        query = query.filter(models.Product.available == True)
    return query.all()


# Conference CRUD
def create_conference(db: Session, student_id: str, parent_id: str, staff_id: str,
                      date_time: datetime, location: str, notes: str = None) -> models.Conference:
    conference = models.Conference(
        conference_id=generate_id("conf_"),
        student_id=student_id,
        parent_id=parent_id,
        staff_id=staff_id,
        date_time=date_time,
        location=location,
        status="Scheduled",
        notes=notes
    )
    db.add(conference)
    db.commit()
    db.refresh(conference)
    return conference


def get_conferences_by_staff(db: Session, staff_id: str, 
                              upcoming_only: bool = True) -> List[models.Conference]:
    query = db.query(models.Conference).filter(
        models.Conference.staff_id == staff_id
    )
    if upcoming_only:
        query = query.filter(
            and_(
                models.Conference.date_time >= datetime.utcnow(),
                models.Conference.status == "Scheduled"
            )
        )
    return query.order_by(models.Conference.date_time).all()


# Incident CRUD
def create_incident(db: Session, campus_id: str, student_id: str,
                    reported_by_staff_id: str, incident_type: str, severity: str,
                    incident_date: date, time: str, description: str,
                    action_taken: str, parent_notified: bool = False,
                    followup_required: bool = False) -> models.Incident:
    incident = models.Incident(
        incident_id=generate_id("inc_"),
        campus_id=campus_id,
        student_id=student_id,
        reported_by_staff_id=reported_by_staff_id,
        incident_type=incident_type,
        severity=severity,
        date=incident_date,
        time=time,
        description=description,
        action_taken=action_taken,
        parent_notified=parent_notified,
        followup_required=followup_required
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def get_incidents_by_student(db: Session, student_id: str) -> List[models.Incident]:
    return db.query(models.Incident).filter(
        models.Incident.student_id == student_id
    ).order_by(models.Incident.date.desc()).all()


# Behavior Note CRUD
def create_behavior_note(db: Session, campus_id: str, student_id: str,
                         note_date: date, note_type: str, summary: str,
                         recorded_by: str, flag_for_followup: bool = False) -> models.BehaviorNote:
    note = models.BehaviorNote(
        behavior_note_id=generate_id("beh_"),
        campus_id=campus_id,
        student_id=student_id,
        date=note_date,
        type=note_type,
        summary=summary,
        recorded_by=recorded_by,
        flag_for_followup=flag_for_followup
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_behavior_notes_by_student(db: Session, student_id: str) -> List[models.BehaviorNote]:
    return db.query(models.BehaviorNote).filter(
        models.BehaviorNote.student_id == student_id
    ).order_by(models.BehaviorNote.date.desc()).all()
