"""
Utility functions for loading data from the SQLite database into in-memory
Pydantic model lists, and for persisting write operations back to the database.

This module bridges the gap between the SQLAlchemy ORM models (models.py) and
the Pydantic response models (main.py), enabling database persistence while
keeping the existing API endpoint code largely unchanged.
"""
import json
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal


# ============================================================================
# Helper: safely parse JSON text columns back to Python lists/dicts
# ============================================================================

def _json_loads(val, default=None):
    """Safely parse a JSON string, returning default if None or invalid."""
    if val is None:
        return default if default is not None else []
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except (json.JSONDecodeError, TypeError):
        return default if default is not None else []


def _json_dumps(val):
    """Serialize a Python object to JSON string for storage."""
    if val is None:
        return None
    if isinstance(val, str):
        return val
    return json.dumps(val, default=str)


def _enum_val(val):
    """Extract .value from an enum, or return the value as-is."""
    return val.value if hasattr(val, 'value') else val


def _upsert(db, model_class, business_key_field: str, business_key_value, field_dict: dict):
    """
    Query-first upsert: find existing row by business key, update it if found,
    otherwise insert a new row. This avoids the merge() issue where id=None
    always causes an INSERT even when the business key already exists.
    """
    existing = db.query(model_class).filter(
        getattr(model_class, business_key_field) == business_key_value
    ).first()
    if existing:
        for k, v in field_dict.items():
            if k != business_key_field:
                setattr(existing, k, v)
    else:
        obj = model_class(**field_dict)
        db.add(obj)


# ============================================================================
# LOAD FROM DATABASE - converts SQLAlchemy rows to Pydantic-compatible dicts
# ============================================================================

def load_all_from_db() -> dict:
    """
    Load all data from the SQLite database and return a dict whose keys
    match the keys used by generate_all_demo_data() in demo_data.py.
    Each value is a list of Pydantic model instances (constructed from dicts).
    """
    db = SessionLocal()
    try:
        data = {}

        # Organizations
        data["organizations"] = [
            _org_to_dict(r) for r in db.query(models.Organization).all()
        ]

        # Campuses
        data["campuses"] = [
            _campus_to_dict(r) for r in db.query(models.Campus).all()
        ]

        # Users
        data["users"] = [
            _user_to_dict(r) for r in db.query(models.User).all()
        ]

        # Audit logs
        data["audit_logs"] = [
            _audit_to_dict(r) for r in db.query(models.AuditLog).all()
        ]

        # Staff
        data["staff"] = [
            _staff_to_dict(r) for r in db.query(models.Staff).all()
        ]

        # Families - need parent_ids and student_ids
        all_parents = db.query(models.Parent).all()
        all_students = db.query(models.Student).all()
        parent_by_family = {}
        student_by_family = {}
        for p in all_parents:
            parent_by_family.setdefault(p.family_id, []).append(p.parent_id)
        for s in all_students:
            student_by_family.setdefault(s.family_id, []).append(s.student_id)

        data["families"] = [
            _family_to_dict(r, parent_by_family.get(r.family_id, []),
                           student_by_family.get(r.family_id, []))
            for r in db.query(models.Family).all()
        ]

        # Parents - need student_ids via family
        student_by_family_for_parent = {}
        for s in all_students:
            student_by_family_for_parent.setdefault(s.family_id, []).append(s.student_id)

        data["parents"] = [
            _parent_to_dict(r, student_by_family_for_parent.get(r.family_id, []))
            for r in all_parents
        ]

        # Students
        data["students"] = [
            _student_to_dict(r) for r in all_students
        ]

        # Grade records
        data["grade_records"] = [
            _grade_record_to_dict(r) for r in db.query(models.GradeRecord).all()
        ]

        # Behavior notes
        data["behavior_notes"] = [
            _behavior_to_dict(r) for r in db.query(models.BehaviorNote).all()
        ]

        # Attendance records
        data["attendance_records"] = [
            _attendance_to_dict(r) for r in db.query(models.AttendanceRecord).all()
        ]

        # IXL summaries
        data["ixl_summaries"] = [
            _ixl_to_dict(r) for r in db.query(models.IXLSummary).all()
        ]

        # Acellus summaries
        data["acellus_summaries"] = [
            _acellus_summary_to_dict(r) for r in db.query(models.AcellusSummary).all()
        ]

        # Acellus courses
        data["acellus_courses"] = [
            _acellus_course_to_dict(r) for r in db.query(models.AcellusCourse).all()
        ]

        # Billing records
        data["billing_records"] = [
            _billing_to_dict(r) for r in db.query(models.BillingRecord).all()
        ]

        # Conferences
        data["conferences"] = [
            _conference_to_dict(r) for r in db.query(models.Conference).all()
        ]

        # Messages
        data["messages"] = [
            _message_to_dict(r) for r in db.query(models.Message).all()
        ]

        # Events
        data["events"] = [
            _event_to_dict(r) for r in db.query(models.Event).all()
        ]

        # Event RSVPs
        data["event_rsvps"] = [
            _rsvp_to_dict(r) for r in db.query(models.EventRSVP).all()
        ]

        # Documents
        data["documents"] = [
            _document_to_dict(r) for r in db.query(models.Document).all()
        ]

        # Document signatures
        data["document_signatures"] = [
            _signature_to_dict(r) for r in db.query(models.DocumentSignature).all()
        ]

        # Products
        data["products"] = [
            _product_to_dict(r) for r in db.query(models.Product).all()
        ]

        # Orders
        data["orders"] = [
            _order_to_dict(r) for r in db.query(models.Order).all()
        ]

        # Photo albums
        data["photo_albums"] = [
            _photo_album_to_dict(r) for r in db.query(models.PhotoAlbum).all()
        ]

        # Incidents
        data["incidents"] = [
            _incident_to_dict(r) for r in db.query(models.Incident).all()
        ]

        # Health records
        data["health_records"] = [
            _health_to_dict(r) for r in db.query(models.HealthRecord).all()
        ]

        # Invoices
        data["invoices"] = [
            _invoice_to_dict(r) for r in db.query(models.Invoice).all()
        ]

        # Invoice line items
        data["invoice_line_items"] = [
            _invoice_line_to_dict(r) for r in db.query(models.InvoiceLineItem).all()
        ]

        # Payment plans
        data["payment_plans"] = [
            _payment_plan_to_dict(r) for r in db.query(models.PaymentPlan).all()
        ]

        # Payment schedules
        data["payment_schedules"] = [
            _payment_schedule_to_dict(r) for r in db.query(models.PaymentSchedule).all()
        ]

        # Leads
        data["leads"] = [
            _lead_to_dict(r) for r in db.query(models.Lead).all()
        ]

        # Campus capacity
        data["campus_capacity"] = [
            _capacity_to_dict(r) for r in db.query(models.CampusCapacity).all()
        ]

        # Message templates
        data["message_templates"] = [
            _template_to_dict(r) for r in db.query(models.MessageTemplate).all()
        ]

        # Broadcast messages
        data["broadcast_messages"] = [
            _broadcast_to_dict(r) for r in db.query(models.BroadcastMessage).all()
        ]

        # Automated alerts
        data["automated_alerts"] = [
            _alert_to_dict(r) for r in db.query(models.AutomatedAlert).all()
        ]

        # Academic standards
        data["academic_standards"] = [
            _standard_to_dict(r) for r in db.query(models.AcademicStandard).all()
        ]

        # Standard assessments
        data["standard_assessments"] = [
            _assessment_to_dict(r) for r in db.query(models.StandardAssessment).all()
        ]

        # Progress reports
        data["progress_reports"] = [
            _progress_report_to_dict(r) for r in db.query(models.ProgressReport).all()
        ]

        # IEP/504 plans
        data["iep_504_plans"] = [
            _iep_to_dict(r) for r in db.query(models.IEP504Plan).all()
        ]

        # Accommodations
        data["accommodations"] = [
            _accommodation_to_dict(r) for r in db.query(models.Accommodation).all()
        ]

        # IEP Goals
        data["iep_goals"] = [
            _iep_goal_to_dict(r) for r in db.query(models.IEPGoal).all()
        ]

        # Intervention plans
        data["intervention_plans"] = [
            _intervention_to_dict(r) for r in db.query(models.InterventionPlan).all()
        ]

        # Intervention progress
        data["intervention_progress"] = [
            _intervention_progress_to_dict(r) for r in db.query(models.InterventionProgress).all()
        ]

        # At-risk assessments
        data["at_risk_assessments"] = [
            _at_risk_to_dict(r) for r in db.query(models.AtRiskAssessment).all()
        ]

        # Retention predictions
        data["retention_predictions"] = [
            _retention_to_dict(r) for r in db.query(models.RetentionPrediction).all()
        ]

        # Enrollment forecasts
        data["enrollment_forecasts"] = [
            _forecast_to_dict(r) for r in db.query(models.EnrollmentForecast).all()
        ]

        # Assignments
        data["assignments"] = [
            _assignment_to_dict(r) for r in db.query(models.Assignment).all()
        ]

        # Grade entries
        data["grade_entries"] = [
            _grade_entry_to_dict(r) for r in db.query(models.GradeEntry).all()
        ]

        # Announcements
        data["announcements"] = [
            _announcement_to_dict(r) for r in db.query(models.Announcement).all()
        ]

        # Announcement reads
        data["announcement_reads"] = [
            _announcement_read_to_dict(r) for r in db.query(models.AnnouncementRead).all()
        ]

        # Event workflows
        data["event_workflows"] = [
            _workflow_to_dict(r) for r in db.query(models.EventWorkflow).all()
        ]

        # SUFS scholarships
        data["sufs_scholarships"] = [
            _sufs_scholarship_to_dict(r) for r in db.query(models.SUFSScholarship).all()
        ]

        # SUFS claims
        data["sufs_claims"] = [
            _sufs_claim_to_dict(r) for r in db.query(models.SUFSClaim).all()
        ]

        # SUFS payments
        data["sufs_payments"] = [
            _sufs_payment_to_dict(r) for r in db.query(models.SUFSPayment).all()
        ]

        # SUFS payment allocations
        data["sufs_payment_allocations"] = [
            _sufs_allocation_to_dict(r) for r in db.query(models.SUFSPaymentAllocation).all()
        ]

        return data

    finally:
        db.close()


# ============================================================================
# SAVE TO DATABASE - persists Pydantic model data to SQLAlchemy rows
# ============================================================================

def save_student(pydantic_student):
    """Persist a student to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            student_id=pydantic_student.student_id,
            campus_id=pydantic_student.campus_id,
            first_name=pydantic_student.first_name,
            last_name=pydantic_student.last_name,
            date_of_birth=pydantic_student.date_of_birth,
            grade=_enum_val(pydantic_student.grade) if hasattr(pydantic_student.grade, 'value') else pydantic_student.grade,
            session=_enum_val(pydantic_student.session),
            room=_enum_val(pydantic_student.room),
            status=_enum_val(pydantic_student.status),
            family_id=pydantic_student.family_id,
            enrollment_start_date=pydantic_student.enrollment_start_date,
            enrollment_end_date=getattr(pydantic_student, 'enrollment_end_date', None),
            attendance_present_count=pydantic_student.attendance_present_count,
            attendance_absent_count=pydantic_student.attendance_absent_count,
            attendance_tardy_count=pydantic_student.attendance_tardy_count,
            overall_grade_flag=_enum_val(pydantic_student.overall_grade_flag),
            ixl_status_flag=_enum_val(pydantic_student.ixl_status_flag),
            overall_risk_flag=_enum_val(pydantic_student.overall_risk_flag),
            funding_source=_enum_val(pydantic_student.funding_source),
            step_up_percentage=pydantic_student.step_up_percentage,
        )
        _upsert(db, models.Student, "student_id", pydantic_student.student_id, fields)
        db.commit()
    finally:
        db.close()


def save_attendance(pydantic_att):
    """Persist an attendance record to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            attendance_id=pydantic_att.attendance_id,
            campus_id=getattr(pydantic_att, 'campus_id', None),
            student_id=pydantic_att.student_id,
            date=pydantic_att.date,
            status=_enum_val(pydantic_att.status),
            session=_enum_val(pydantic_att.session),
        )
        _upsert(db, models.AttendanceRecord, "attendance_id", pydantic_att.attendance_id, fields)
        db.commit()
    finally:
        db.close()


def save_rsvp(pydantic_rsvp):
    """Persist an event RSVP to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            rsvp_id=pydantic_rsvp.rsvp_id,
            event_id=pydantic_rsvp.event_id,
            family_id=pydantic_rsvp.family_id,
            parent_id=pydantic_rsvp.parent_id,
            student_ids=_json_dumps(pydantic_rsvp.student_ids),
            status=_enum_val(pydantic_rsvp.status),
            response_date=getattr(pydantic_rsvp, 'response_date', None),
        )
        _upsert(db, models.EventRSVP, "rsvp_id", pydantic_rsvp.rsvp_id, fields)
        db.commit()
    finally:
        db.close()


def save_signature(pydantic_sig):
    """Persist a document signature to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            signature_id=pydantic_sig.signature_id,
            document_id=pydantic_sig.document_id,
            parent_id=pydantic_sig.parent_id,
            student_id=getattr(pydantic_sig, 'student_id', None),
            signed_date=pydantic_sig.signed_date,
            signature_data=pydantic_sig.signature_data,
        )
        _upsert(db, models.DocumentSignature, "signature_id", pydantic_sig.signature_id, fields)
        db.commit()
    finally:
        db.close()


def save_product(pydantic_prod):
    """Persist a product to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            product_id=pydantic_prod.product_id,
            name=pydantic_prod.name,
            description=pydantic_prod.description,
            category=_enum_val(pydantic_prod.category),
            price=pydantic_prod.price,
            image_url=getattr(pydantic_prod, 'image_url', None),
            available=pydantic_prod.available,
        )
        _upsert(db, models.Product, "product_id", pydantic_prod.product_id, fields)
        db.commit()
    finally:
        db.close()


def delete_product(product_id: str):
    """Delete a product from the database."""
    db = SessionLocal()
    try:
        db.query(models.Product).filter(models.Product.product_id == product_id).delete()
        db.commit()
    finally:
        db.close()


def save_order(pydantic_order):
    """Persist an order to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            order_id=pydantic_order.order_id,
            family_id=pydantic_order.family_id,
            parent_id=pydantic_order.parent_id,
            items=_json_dumps(pydantic_order.items),
            total_amount=pydantic_order.total_amount,
            status=_enum_val(pydantic_order.status),
            order_date=pydantic_order.order_date,
            payment_date=getattr(pydantic_order, 'payment_date', None),
        )
        _upsert(db, models.Order, "order_id", pydantic_order.order_id, fields)
        db.commit()
    finally:
        db.close()


def save_photo_album(pydantic_album):
    """Persist a photo album to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            album_id=pydantic_album.album_id,
            campus_id=pydantic_album.campus_id,
            title=pydantic_album.title,
            description=pydantic_album.description,
            created_by_staff_id=pydantic_album.created_by_staff_id,
            created_date=pydantic_album.created_date,
            status=_enum_val(pydantic_album.status),
            photo_urls=_json_dumps(pydantic_album.photo_urls),
            visible_to_grades=_json_dumps(pydantic_album.visible_to_grades),
        )
        _upsert(db, models.PhotoAlbum, "album_id", pydantic_album.album_id, fields)
        db.commit()
    finally:
        db.close()


def save_incident(pydantic_inc):
    """Persist an incident to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            incident_id=pydantic_inc.incident_id,
            campus_id=pydantic_inc.campus_id,
            student_id=pydantic_inc.student_id,
            reported_by_staff_id=pydantic_inc.reported_by_staff_id,
            incident_type=_enum_val(pydantic_inc.incident_type),
            severity=_enum_val(pydantic_inc.severity),
            date=pydantic_inc.date,
            time=pydantic_inc.time,
            description=pydantic_inc.description,
            action_taken=pydantic_inc.action_taken,
            parent_notified=pydantic_inc.parent_notified,
            followup_required=pydantic_inc.followup_required,
        )
        _upsert(db, models.Incident, "incident_id", pydantic_inc.incident_id, fields)
        db.commit()
    finally:
        db.close()


def save_health_record(pydantic_hr):
    """Persist a health record to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            health_record_id=pydantic_hr.health_record_id,
            campus_id=pydantic_hr.campus_id,
            student_id=pydantic_hr.student_id,
            allergies=_json_dumps(pydantic_hr.allergies),
            medications=_json_dumps(pydantic_hr.medications),
            medical_conditions=_json_dumps(pydantic_hr.medical_conditions),
            emergency_contact_name=pydantic_hr.emergency_contact_name,
            emergency_contact_phone=pydantic_hr.emergency_contact_phone,
            emergency_contact_relationship=pydantic_hr.emergency_contact_relationship,
            physician_name=getattr(pydantic_hr, 'physician_name', None),
            physician_phone=getattr(pydantic_hr, 'physician_phone', None),
            last_updated=pydantic_hr.last_updated,
        )
        _upsert(db, models.HealthRecord, "health_record_id", pydantic_hr.health_record_id, fields)
        db.commit()
    finally:
        db.close()


def save_invoice(pydantic_inv):
    """Persist an invoice to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            invoice_id=pydantic_inv.invoice_id,
            campus_id=pydantic_inv.campus_id,
            family_id=pydantic_inv.family_id,
            invoice_number=pydantic_inv.invoice_number,
            invoice_date=pydantic_inv.invoice_date,
            due_date=pydantic_inv.due_date,
            status=_enum_val(pydantic_inv.status),
            subtotal=pydantic_inv.subtotal,
            tax=pydantic_inv.tax,
            total=pydantic_inv.total,
            amount_paid=pydantic_inv.amount_paid,
            balance=pydantic_inv.balance,
            notes=getattr(pydantic_inv, 'notes', None),
            created_date=pydantic_inv.created_date,
            last_updated=pydantic_inv.last_updated,
        )
        _upsert(db, models.Invoice, "invoice_id", pydantic_inv.invoice_id, fields)
        db.commit()
    finally:
        db.close()


def save_invoice_line_item(pydantic_li):
    """Persist an invoice line item to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            line_item_id=pydantic_li.line_item_id,
            invoice_id=pydantic_li.invoice_id,
            description=pydantic_li.description,
            category=_enum_val(pydantic_li.category),
            student_id=getattr(pydantic_li, 'student_id', None),
            quantity=pydantic_li.quantity,
            unit_price=pydantic_li.unit_price,
            total=pydantic_li.total,
            funding_source=_enum_val(pydantic_li.funding_source) if pydantic_li.funding_source else None,
        )
        _upsert(db, models.InvoiceLineItem, "line_item_id", pydantic_li.line_item_id, fields)
        db.commit()
    finally:
        db.close()


def save_payment_plan(pydantic_pp):
    """Persist a payment plan to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            payment_plan_id=pydantic_pp.payment_plan_id,
            campus_id=pydantic_pp.campus_id,
            family_id=pydantic_pp.family_id,
            plan_name=pydantic_pp.plan_name,
            total_amount=pydantic_pp.total_amount,
            amount_paid=pydantic_pp.amount_paid,
            balance=pydantic_pp.balance,
            start_date=pydantic_pp.start_date,
            end_date=pydantic_pp.end_date,
            status=_enum_val(pydantic_pp.status),
            created_date=pydantic_pp.created_date,
            last_updated=pydantic_pp.last_updated,
        )
        _upsert(db, models.PaymentPlan, "payment_plan_id", pydantic_pp.payment_plan_id, fields)
        db.commit()
    finally:
        db.close()


def save_payment_schedule(pydantic_ps):
    """Persist a payment schedule entry to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            schedule_id=pydantic_ps.schedule_id,
            payment_plan_id=pydantic_ps.payment_plan_id,
            installment_number=pydantic_ps.installment_number,
            due_date=pydantic_ps.due_date,
            amount=pydantic_ps.amount,
            paid=pydantic_ps.paid,
            paid_date=getattr(pydantic_ps, 'paid_date', None),
            paid_amount=pydantic_ps.paid_amount,
        )
        _upsert(db, models.PaymentSchedule, "schedule_id", pydantic_ps.schedule_id, fields)
        db.commit()
    finally:
        db.close()


def save_lead(pydantic_lead):
    """Persist a lead to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            lead_id=pydantic_lead.lead_id,
            campus_id=pydantic_lead.campus_id,
            parent_first_name=pydantic_lead.parent_first_name,
            parent_last_name=pydantic_lead.parent_last_name,
            email=pydantic_lead.email,
            phone=pydantic_lead.phone,
            child_first_name=pydantic_lead.child_first_name,
            child_last_name=pydantic_lead.child_last_name,
            child_dob=pydantic_lead.child_dob,
            desired_grade=pydantic_lead.desired_grade,
            desired_start_date=pydantic_lead.desired_start_date,
            stage=_enum_val(pydantic_lead.stage),
            source=_enum_val(pydantic_lead.source),
            created_date=pydantic_lead.created_date,
            last_contact_date=getattr(pydantic_lead, 'last_contact_date', None),
            tour_date=getattr(pydantic_lead, 'tour_date', None),
            notes=pydantic_lead.notes,
            assigned_to=getattr(pydantic_lead, 'assigned_to', None),
        )
        _upsert(db, models.Lead, "lead_id", pydantic_lead.lead_id, fields)
        db.commit()
    finally:
        db.close()


def save_template(pydantic_tmpl):
    """Persist a message template to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            template_id=pydantic_tmpl.template_id,
            name=pydantic_tmpl.name,
            trigger_type=_enum_val(pydantic_tmpl.trigger_type),
            communication_type=_enum_val(pydantic_tmpl.communication_type),
            subject=pydantic_tmpl.subject,
            body=pydantic_tmpl.body,
            active=pydantic_tmpl.active,
            created_date=pydantic_tmpl.created_date,
        )
        _upsert(db, models.MessageTemplate, "template_id", pydantic_tmpl.template_id, fields)
        db.commit()
    finally:
        db.close()


def save_broadcast(pydantic_bc):
    """Persist a broadcast message to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            broadcast_id=pydantic_bc.broadcast_id,
            campus_id=getattr(pydantic_bc, 'campus_id', None),
            sender_id=pydantic_bc.sender_id,
            communication_type=_enum_val(pydantic_bc.communication_type),
            subject=pydantic_bc.subject,
            body=pydantic_bc.body,
            recipient_type=pydantic_bc.recipient_type,
            recipient_count=pydantic_bc.recipient_count,
            status=_enum_val(pydantic_bc.status),
            scheduled_date=getattr(pydantic_bc, 'scheduled_date', None),
            sent_date=getattr(pydantic_bc, 'sent_date', None),
            created_date=pydantic_bc.created_date,
        )
        _upsert(db, models.BroadcastMessage, "broadcast_id", pydantic_bc.broadcast_id, fields)
        db.commit()
    finally:
        db.close()


def save_assessment(pydantic_a):
    """Persist a standard assessment to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            assessment_id=pydantic_a.assessment_id,
            student_id=pydantic_a.student_id,
            standard_id=pydantic_a.standard_id,
            mastery_level=_enum_val(pydantic_a.mastery_level),
            assessment_date=pydantic_a.assessment_date,
            notes=getattr(pydantic_a, 'notes', None),
            teacher_id=getattr(pydantic_a, 'teacher_id', None),
        )
        _upsert(db, models.StandardAssessment, "assessment_id", pydantic_a.assessment_id, fields)
        db.commit()
    finally:
        db.close()


def save_assignment(pydantic_a):
    """Persist an assignment to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            assignment_id=pydantic_a.assignment_id,
            campus_id=getattr(pydantic_a, 'campus_id', None),
            teacher_id=getattr(pydantic_a, 'teacher_id', None),
            room=getattr(pydantic_a, 'room', None),
            subject=pydantic_a.subject,
            assignment_type=_enum_val(pydantic_a.assignment_type),
            title=pydantic_a.title,
            description=getattr(pydantic_a, 'description', None),
            max_points=pydantic_a.max_points,
            due_date=pydantic_a.due_date,
            status=_enum_val(pydantic_a.status),
            created_date=getattr(pydantic_a, 'created_date', None),
        )
        _upsert(db, models.Assignment, "assignment_id", pydantic_a.assignment_id, fields)
        db.commit()
    finally:
        db.close()


def save_grade_entry(pydantic_ge):
    """Persist a grade entry to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            entry_id=pydantic_ge.entry_id,
            assignment_id=pydantic_ge.assignment_id,
            student_id=pydantic_ge.student_id,
            campus_id=getattr(pydantic_ge, 'campus_id', None),
            points_earned=getattr(pydantic_ge, 'points_earned', None),
            letter_grade=getattr(pydantic_ge, 'letter_grade', None),
            percentage=getattr(pydantic_ge, 'percentage', None),
            status=_enum_val(pydantic_ge.status),
            comment=getattr(pydantic_ge, 'comment', None),
            submitted_date=getattr(pydantic_ge, 'submitted_date', None),
            graded_date=getattr(pydantic_ge, 'graded_date', None),
            graded_by=getattr(pydantic_ge, 'graded_by', None),
        )
        _upsert(db, models.GradeEntry, "entry_id", pydantic_ge.entry_id, fields)
        db.commit()
    finally:
        db.close()


def save_announcement(pydantic_ann):
    """Persist an announcement to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            announcement_id=pydantic_ann.announcement_id,
            campus_id=getattr(pydantic_ann, 'campus_id', None),
            title=pydantic_ann.title,
            content=pydantic_ann.content,
            category=_enum_val(pydantic_ann.category),
            status=_enum_val(pydantic_ann.status),
            created_by=getattr(pydantic_ann, 'created_by', None),
            created_by_role=getattr(pydantic_ann, 'created_by_role', None),
            approved_by=getattr(pydantic_ann, 'approved_by', None),
            approved_date=getattr(pydantic_ann, 'approved_date', None),
            published_date=getattr(pydantic_ann, 'published_date', None),
            expires_date=getattr(pydantic_ann, 'expires_date', None),
            is_pinned=getattr(pydantic_ann, 'is_pinned', False),
            target_roles=_json_dumps(getattr(pydantic_ann, 'target_roles', [])),
            priority=getattr(pydantic_ann, 'priority', 'Normal'),
            created_date=getattr(pydantic_ann, 'created_date', None),
            target_audience=getattr(pydantic_ann, 'target_audience', None),
        )
        _upsert(db, models.Announcement, "announcement_id", pydantic_ann.announcement_id, fields)
        db.commit()
    finally:
        db.close()


def save_announcement_read(pydantic_ar):
    """Persist an announcement read to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            read_id=pydantic_ar.read_id,
            announcement_id=pydantic_ar.announcement_id,
            user_id=pydantic_ar.user_id,
            read_date=pydantic_ar.read_date,
        )
        _upsert(db, models.AnnouncementRead, "read_id", pydantic_ar.read_id, fields)
        db.commit()
    finally:
        db.close()


def save_workflow(pydantic_wf):
    """Persist an event workflow to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            workflow_id=pydantic_wf.workflow_id,
            event_id=pydantic_wf.event_id,
            rsvp_id=pydantic_wf.rsvp_id,
            family_id=pydantic_wf.family_id,
            student_id=pydantic_wf.student_id,
            status=_enum_val(pydantic_wf.status),
            permission_slip_signed=pydantic_wf.permission_slip_signed,
            permission_slip_signature_id=getattr(pydantic_wf, 'permission_slip_signature_id', None),
            payment_complete=pydantic_wf.payment_complete,
            payment_order_id=getattr(pydantic_wf, 'payment_order_id', None),
            created_date=pydantic_wf.created_date,
            completed_date=getattr(pydantic_wf, 'completed_date', None),
        )
        _upsert(db, models.EventWorkflow, "workflow_id", pydantic_wf.workflow_id, fields)
        db.commit()
    finally:
        db.close()


def save_staff(pydantic_staff):
    """Persist a staff member to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            staff_id=pydantic_staff.staff_id,
            campus_id=pydantic_staff.campus_ids[0] if pydantic_staff.campus_ids else None,
            campus_ids=_json_dumps(pydantic_staff.campus_ids),
            first_name=pydantic_staff.first_name,
            last_name=pydantic_staff.last_name,
            role=_enum_val(pydantic_staff.role),
            email=pydantic_staff.email,
            assigned_rooms=_json_dumps(pydantic_staff.assigned_rooms),
            permissions=pydantic_staff.permissions,
            active=True,
        )
        _upsert(db, models.Staff, "staff_id", pydantic_staff.staff_id, fields)
        db.commit()
    finally:
        db.close()


def save_billing_record(pydantic_br):
    """Persist a billing record to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            billing_record_id=pydantic_br.billing_record_id,
            campus_id=pydantic_br.campus_id,
            family_id=pydantic_br.family_id,
            date=pydantic_br.date,
            type=pydantic_br.type,
            description=pydantic_br.description,
            amount=pydantic_br.amount,
            source=_enum_val(pydantic_br.source) if pydantic_br.source else None,
            period_month=getattr(pydantic_br, 'period_month', None),
            category=_enum_val(pydantic_br.category) if pydantic_br.category else None,
            student_id=getattr(pydantic_br, 'student_id', None),
        )
        _upsert(db, models.BillingRecord, "billing_record_id", pydantic_br.billing_record_id, fields)
        db.commit()
    finally:
        db.close()


def save_family(pydantic_fam):
    """Persist a family to the database (without parent_ids/student_ids which are relational)."""
    db = SessionLocal()
    try:
        fields = dict(
            family_id=pydantic_fam.family_id,
            family_name=pydantic_fam.family_name,
            primary_parent_id=pydantic_fam.primary_parent_id,
            monthly_tuition_amount=pydantic_fam.monthly_tuition_amount,
            current_balance=pydantic_fam.current_balance,
            billing_status=_enum_val(pydantic_fam.billing_status),
            last_payment_date=pydantic_fam.last_payment_date,
            last_payment_amount=pydantic_fam.last_payment_amount,
        )
        _upsert(db, models.Family, "family_id", pydantic_fam.family_id, fields)
        db.commit()
    finally:
        db.close()


def save_sufs_scholarship(pydantic_s):
    """Persist a SUFS scholarship to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            scholarship_id=pydantic_s.scholarship_id,
            student_id=pydantic_s.student_id,
            family_id=pydantic_s.family_id,
            campus_id=pydantic_s.campus_id,
            scholarship_type=_enum_val(pydantic_s.scholarship_type),
            award_id=getattr(pydantic_s, 'award_id', None),
            school_year=pydantic_s.school_year,
            annual_award_amount=pydantic_s.annual_award_amount,
            quarterly_amount=pydantic_s.quarterly_amount,
            remaining_balance=pydantic_s.remaining_balance,
            start_date=pydantic_s.start_date,
            end_date=getattr(pydantic_s, 'end_date', None),
            status=_enum_val(pydantic_s.status) if hasattr(pydantic_s.status, 'value') else pydantic_s.status,
            eligibility_verified=pydantic_s.eligibility_verified,
            eligibility_verified_date=getattr(pydantic_s, 'eligibility_verified_date', None),
            notes=getattr(pydantic_s, 'notes', None),
            created_date=pydantic_s.created_date,
            last_updated=pydantic_s.last_updated,
        )
        _upsert(db, models.SUFSScholarship, "scholarship_id", pydantic_s.scholarship_id, fields)
        db.commit()
    finally:
        db.close()


def save_sufs_claim(pydantic_c):
    """Persist a SUFS claim to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            claim_id=pydantic_c.claim_id,
            scholarship_id=pydantic_c.scholarship_id,
            student_id=pydantic_c.student_id,
            family_id=pydantic_c.family_id,
            campus_id=pydantic_c.campus_id,
            claim_period=pydantic_c.claim_period,
            claim_date=pydantic_c.claim_date,
            amount_claimed=pydantic_c.amount_claimed,
            tuition_amount=pydantic_c.tuition_amount,
            fees_amount=pydantic_c.fees_amount,
            status=_enum_val(pydantic_c.status),
            submitted_date=getattr(pydantic_c, 'submitted_date', None),
            approved_date=getattr(pydantic_c, 'approved_date', None),
            paid_date=getattr(pydantic_c, 'paid_date', None),
            paid_amount=getattr(pydantic_c, 'paid_amount', None),
            denial_reason=getattr(pydantic_c, 'denial_reason', None),
            sufs_reference_number=getattr(pydantic_c, 'sufs_reference_number', None),
            notes=getattr(pydantic_c, 'notes', None),
            created_date=pydantic_c.created_date,
            last_updated=pydantic_c.last_updated,
        )
        _upsert(db, models.SUFSClaim, "claim_id", pydantic_c.claim_id, fields)
        db.commit()
    finally:
        db.close()


def save_sufs_payment(pydantic_p):
    """Persist a SUFS payment to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            payment_id=pydantic_p.payment_id,
            campus_id=pydantic_p.campus_id,
            payment_date=pydantic_p.payment_date,
            deposit_date=getattr(pydantic_p, 'deposit_date', None),
            total_amount=pydantic_p.total_amount,
            sufs_reference_number=getattr(pydantic_p, 'sufs_reference_number', None),
            bank_reference=getattr(pydantic_p, 'bank_reference', None),
            status=_enum_val(pydantic_p.status),
            reconciled_date=getattr(pydantic_p, 'reconciled_date', None),
            reconciled_by=getattr(pydantic_p, 'reconciled_by', None),
            notes=getattr(pydantic_p, 'notes', None),
            created_date=pydantic_p.created_date,
        )
        _upsert(db, models.SUFSPayment, "payment_id", pydantic_p.payment_id, fields)
        db.commit()
    finally:
        db.close()


def save_sufs_allocation(pydantic_a):
    """Persist a SUFS payment allocation to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            allocation_id=pydantic_a.allocation_id,
            payment_id=pydantic_a.payment_id,
            claim_id=pydantic_a.claim_id,
            student_id=pydantic_a.student_id,
            family_id=pydantic_a.family_id,
            amount=pydantic_a.amount,
            status=pydantic_a.status,
            discrepancy_amount=getattr(pydantic_a, 'discrepancy_amount', None),
            discrepancy_reason=getattr(pydantic_a, 'discrepancy_reason', None),
            created_date=pydantic_a.created_date,
        )
        _upsert(db, models.SUFSPaymentAllocation, "allocation_id", pydantic_a.allocation_id, fields)
        db.commit()
    finally:
        db.close()


def save_ixl_summary(pydantic_ixl):
    """Persist an IXL summary to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            ixl_summary_id=pydantic_ixl.ixl_summary_id,
            student_id=pydantic_ixl.student_id,
            week_start_date=pydantic_ixl.week_start_date,
            weekly_hours=pydantic_ixl.weekly_hours,
            skills_practiced_this_week=pydantic_ixl.skills_practiced_this_week,
            skills_mastered_total=pydantic_ixl.skills_mastered_total,
            math_proficiency=_enum_val(pydantic_ixl.math_proficiency),
            ela_proficiency=_enum_val(pydantic_ixl.ela_proficiency),
            last_active_date=pydantic_ixl.last_active_date,
            recent_skills=_json_dumps(pydantic_ixl.recent_skills),
        )
        _upsert(db, models.IXLSummary, "ixl_summary_id", pydantic_ixl.ixl_summary_id, fields)
        db.commit()
    finally:
        db.close()


def save_acellus_course(pydantic_ac):
    """Persist an Acellus course to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            course_id=pydantic_ac.course_id,
            student_id=pydantic_ac.student_id,
            course_name=pydantic_ac.course_name,
            subject=pydantic_ac.subject,
            total_steps=pydantic_ac.total_steps,
            completed_steps=pydantic_ac.completed_steps,
            completion_percentage=pydantic_ac.completion_percentage,
            current_grade=pydantic_ac.current_grade,
            grade_percentage=pydantic_ac.grade_percentage,
            status=_enum_val(pydantic_ac.status),
            last_activity_date=pydantic_ac.last_activity_date,
            time_spent_hours=pydantic_ac.time_spent_hours,
        )
        _upsert(db, models.AcellusCourse, "course_id", pydantic_ac.course_id, fields)
        db.commit()
    finally:
        db.close()


def save_acellus_summary(pydantic_as):
    """Persist an Acellus summary to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            acellus_summary_id=pydantic_as.acellus_summary_id,
            student_id=pydantic_as.student_id,
            total_courses=pydantic_as.total_courses,
            courses_on_track=pydantic_as.courses_on_track,
            courses_behind=pydantic_as.courses_behind,
            overall_gpa=pydantic_as.overall_gpa,
            total_time_spent_hours=pydantic_as.total_time_spent_hours,
            last_active_date=pydantic_as.last_active_date,
            overall_status=_enum_val(pydantic_as.overall_status),
        )
        _upsert(db, models.AcellusSummary, "acellus_summary_id", pydantic_as.acellus_summary_id, fields)
        db.commit()
    finally:
        db.close()


def update_student_in_db(pydantic_student):
    """Update an existing student in the database."""
    save_student(pydantic_student)


def save_message(pydantic_msg):
    """Persist a message to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            message_id=pydantic_msg.message_id,
            sender_type=_enum_val(pydantic_msg.sender_type),
            sender_id=pydantic_msg.sender_id,
            recipient_type=_enum_val(pydantic_msg.recipient_type),
            recipient_id=pydantic_msg.recipient_id,
            student_id=getattr(pydantic_msg, 'student_id', None),
            content_preview=pydantic_msg.content_preview,
            date_time=pydantic_msg.date_time,
        )
        _upsert(db, models.Message, "message_id", pydantic_msg.message_id, fields)
        db.commit()
    finally:
        db.close()


def save_event(pydantic_evt):
    """Persist an event to the database."""
    db = SessionLocal()
    try:
        fields = dict(
            event_id=pydantic_evt.event_id,
            campus_id=pydantic_evt.campus_id,
            title=pydantic_evt.title,
            description=pydantic_evt.description,
            event_type=_enum_val(pydantic_evt.event_type),
            date=pydantic_evt.date,
            time=pydantic_evt.time,
            location=pydantic_evt.location,
            requires_rsvp=pydantic_evt.requires_rsvp,
            requires_permission_slip=pydantic_evt.requires_permission_slip,
            requires_payment=pydantic_evt.requires_payment,
            payment_amount=getattr(pydantic_evt, 'payment_amount', None),
            created_by_staff_id=pydantic_evt.created_by_staff_id,
        )
        _upsert(db, models.Event, "event_id", pydantic_evt.event_id, fields)
        db.commit()
    finally:
        db.close()


# ============================================================================
# SQLAlchemy -> dict converters (for loading from DB to Pydantic)
# ============================================================================

def _org_to_dict(r):
    return {"organization_id": r.organization_id, "name": r.name, "created_date": r.created_date or date.today()}


def _campus_to_dict(r):
    return {
        "campus_id": r.campus_id, "organization_id": r.organization_id,
        "name": r.name, "location": r.location or "",
        "address": r.address, "phone": r.phone, "email": r.email, "active": r.active if r.active is not None else True
    }


def _user_to_dict(r):
    return {
        "user_id": r.user_id, "email": r.email or "", "password_hash": r.password_hash or "",
        "first_name": r.first_name, "last_name": r.last_name, "role": r.role or "Teacher",
        "campus_ids": _json_loads(r.campus_ids), "active": r.active if r.active is not None else True,
        "created_date": r.created_date or date.today(), "last_login": r.last_login,
    }


def _audit_to_dict(r):
    return {
        "audit_id": r.audit_id, "user_id": r.user_id, "campus_id": r.campus_id,
        "entity_type": r.entity_type or "", "entity_id": r.entity_id or "",
        "action": r.action or "Create", "before_data": None, "after_data": None,
        "timestamp": r.timestamp or datetime.utcnow(), "ip_address": r.ip_address,
    }


def _staff_to_dict(r):
    return {
        "staff_id": r.staff_id,
        "campus_ids": _json_loads(r.campus_ids) if r.campus_ids else ([r.campus_id] if r.campus_id else []),
        "first_name": r.first_name, "last_name": r.last_name,
        "role": r.role or "Teacher", "email": r.email or "",
        "assigned_rooms": _json_loads(r.assigned_rooms),
        "permissions": r.permissions or "Teacher",
    }


def _family_to_dict(r, parent_ids, student_ids):
    return {
        "family_id": r.family_id, "family_name": r.family_name or "",
        "primary_parent_id": r.primary_parent_id or "",
        "parent_ids": parent_ids, "student_ids": student_ids,
        "monthly_tuition_amount": r.monthly_tuition_amount or 0.0,
        "current_balance": r.current_balance or 0.0,
        "billing_status": r.billing_status or "Green",
        "last_payment_date": r.last_payment_date,
        "last_payment_amount": r.last_payment_amount,
    }


def _parent_to_dict(r, student_ids):
    return {
        "parent_id": r.parent_id, "first_name": r.first_name, "last_name": r.last_name,
        "email": r.email or "", "phone": r.phone or "",
        "relationship": r.relationship_type or "Parent",
        "primary_guardian": r.primary_guardian if r.primary_guardian is not None else False,
        "preferred_contact_method": r.preferred_contact_method or "Email",
        "student_ids": student_ids,
    }


def _student_to_dict(r):
    return {
        "student_id": r.student_id, "campus_id": r.campus_id or "",
        "first_name": r.first_name, "last_name": r.last_name,
        "date_of_birth": r.date_of_birth or date(2015, 1, 1),
        "grade": r.grade or "K", "session": r.session or "Morning",
        "room": r.room or "Room 1", "status": r.status or "Active",
        "family_id": r.family_id or "",
        "enrollment_start_date": r.enrollment_start_date or date(2024, 8, 15),
        "enrollment_end_date": r.enrollment_end_date,
        "attendance_present_count": r.attendance_present_count or 0,
        "attendance_absent_count": r.attendance_absent_count or 0,
        "attendance_tardy_count": r.attendance_tardy_count or 0,
        "overall_grade_flag": r.overall_grade_flag or "On track",
        "ixl_status_flag": r.ixl_status_flag or "On track",
        "overall_risk_flag": r.overall_risk_flag or "None",
        "funding_source": r.funding_source or "Out-of-Pocket",
        "step_up_percentage": r.step_up_percentage or 0,
    }


def _grade_record_to_dict(r):
    return {
        "grade_record_id": r.grade_record_id, "campus_id": r.campus_id or "",
        "student_id": r.student_id or "", "subject": r.subject or "",
        "term": r.term or "Current Term", "grade_value": r.grade_value or "C",
        "is_failing": r.is_failing if r.is_failing is not None else False,
    }


def _behavior_to_dict(r):
    return {
        "behavior_note_id": r.behavior_note_id, "campus_id": r.campus_id or "",
        "student_id": r.student_id or "", "date": r.date or date.today(),
        "type": r.type or "Positive", "summary": r.summary or "",
        "flag_for_followup": r.flag_for_followup if r.flag_for_followup is not None else False,
    }


def _attendance_to_dict(r):
    return {
        "attendance_id": r.attendance_id, "campus_id": r.campus_id or "",
        "student_id": r.student_id or "", "date": r.date or date.today(),
        "status": r.status or "Present", "session": r.session or "Morning",
    }


def _ixl_to_dict(r):
    return {
        "ixl_summary_id": r.ixl_summary_id, "student_id": r.student_id or "",
        "week_start_date": r.week_start_date or date.today(),
        "weekly_hours": r.weekly_hours or 0.0,
        "skills_practiced_this_week": r.skills_practiced_this_week or 0,
        "skills_mastered_total": r.skills_mastered_total or 0,
        "math_proficiency": r.math_proficiency or "On track",
        "ela_proficiency": r.ela_proficiency or "On track",
        "last_active_date": r.last_active_date or date.today(),
        "recent_skills": _json_loads(r.recent_skills),
    }


def _acellus_course_to_dict(r):
    return {
        "course_id": r.course_id, "student_id": r.student_id or "",
        "course_name": r.course_name or "", "subject": r.subject or "",
        "total_steps": r.total_steps or 0, "completed_steps": r.completed_steps or 0,
        "completion_percentage": r.completion_percentage or 0.0,
        "current_grade": r.current_grade or "C",
        "grade_percentage": r.grade_percentage or 0.0,
        "status": r.status or "On track",
        "last_activity_date": r.last_activity_date or date.today(),
        "time_spent_hours": r.time_spent_hours or 0.0,
    }


def _acellus_summary_to_dict(r):
    return {
        "acellus_summary_id": r.acellus_summary_id, "student_id": r.student_id or "",
        "total_courses": r.total_courses or 0, "courses_on_track": r.courses_on_track or 0,
        "courses_behind": r.courses_behind or 0, "overall_gpa": r.overall_gpa or 0.0,
        "total_time_spent_hours": r.total_time_spent_hours or 0.0,
        "last_active_date": r.last_active_date or date.today(),
        "overall_status": r.overall_status or "On track",
    }


def _billing_to_dict(r):
    return {
        "billing_record_id": r.billing_record_id, "campus_id": r.campus_id or "",
        "family_id": r.family_id or "", "date": r.date or date.today(),
        "type": r.type or "", "description": r.description or "",
        "amount": r.amount or 0.0, "source": r.source,
        "period_month": r.period_month, "category": r.category,
        "student_id": r.student_id,
    }


def _conference_to_dict(r):
    return {
        "conference_id": r.conference_id, "student_id": r.student_id or "",
        "parent_id": r.parent_id or "", "staff_id": r.staff_id or "",
        "date_time": r.date_time or datetime.utcnow(),
        "location": r.location or "", "status": r.status or "Scheduled",
        "notes": r.notes,
    }


def _message_to_dict(r):
    return {
        "message_id": r.message_id, "sender_type": r.sender_type or "Staff",
        "sender_id": r.sender_id or "", "recipient_type": r.recipient_type or "Parent",
        "recipient_id": r.recipient_id or "", "student_id": r.student_id,
        "date_time": r.date_time or datetime.utcnow(),
        "content_preview": r.content_preview or r.content or "",
    }


def _event_to_dict(r):
    return {
        "event_id": r.event_id, "campus_id": r.campus_id or "",
        "title": r.title, "description": r.description or "",
        "event_type": r.event_type or "School Event",
        "date": r.date or date.today(), "time": r.time or "10:00 AM",
        "location": r.location or "", "requires_rsvp": r.requires_rsvp or False,
        "requires_permission_slip": r.requires_permission_slip or False,
        "requires_payment": r.requires_payment or False,
        "payment_amount": r.payment_amount,
        "created_by_staff_id": r.created_by_staff_id or "",
    }


def _rsvp_to_dict(r):
    return {
        "rsvp_id": r.rsvp_id, "event_id": r.event_id or "",
        "family_id": r.family_id or "", "parent_id": r.parent_id or "",
        "student_ids": _json_loads(r.student_ids),
        "status": r.status or "Pending", "response_date": r.response_date,
    }


def _document_to_dict(r):
    return {
        "document_id": r.document_id, "campus_id": r.campus_id or "",
        "title": r.title, "document_type": r.document_type or "Other",
        "description": r.description or "",
        "required_for": r.required_for or "",
        "status": r.status or "Pending",
        "created_date": r.created_date or date.today(),
        "expiration_date": r.expiration_date, "file_url": r.file_url,
    }


def _signature_to_dict(r):
    return {
        "signature_id": r.signature_id, "document_id": r.document_id or "",
        "parent_id": r.parent_id or "", "student_id": r.student_id,
        "signed_date": r.signed_date or datetime.utcnow(),
        "signature_data": r.signature_data or "",
    }


def _product_to_dict(r):
    return {
        "product_id": r.product_id, "name": r.name,
        "description": r.description or "", "category": r.category or "Other",
        "price": r.price or 0.0, "image_url": r.image_url,
        "available": r.available if r.available is not None else True,
    }


def _order_to_dict(r):
    return {
        "order_id": r.order_id, "family_id": r.family_id or "",
        "parent_id": r.parent_id or "", "items": _json_loads(r.items),
        "total_amount": r.total_amount or 0.0, "status": r.status or "Pending",
        "order_date": r.order_date or datetime.utcnow(),
        "payment_date": r.payment_date,
    }


def _photo_album_to_dict(r):
    return {
        "album_id": r.album_id, "campus_id": r.campus_id or "",
        "title": r.title, "description": r.description or "",
        "created_by_staff_id": r.created_by_staff_id or "",
        "created_date": r.created_date or date.today(),
        "status": r.status or "Draft",
        "photo_urls": _json_loads(r.photo_urls),
        "visible_to_grades": _json_loads(r.visible_to_grades),
    }


def _incident_to_dict(r):
    return {
        "incident_id": r.incident_id, "campus_id": r.campus_id or "",
        "student_id": r.student_id or "",
        "reported_by_staff_id": r.reported_by_staff_id or "",
        "incident_type": r.incident_type or "Other",
        "severity": r.severity or "Low",
        "date": r.date or date.today(), "time": r.time or "",
        "description": r.description or "", "action_taken": r.action_taken or "",
        "parent_notified": r.parent_notified or False,
        "followup_required": r.followup_required or False,
    }


def _health_to_dict(r):
    return {
        "health_record_id": r.health_record_id, "campus_id": r.campus_id or "",
        "student_id": r.student_id or "",
        "allergies": _json_loads(r.allergies),
        "medications": _json_loads(r.medications),
        "medical_conditions": _json_loads(r.medical_conditions),
        "emergency_contact_name": r.emergency_contact_name or "",
        "emergency_contact_phone": r.emergency_contact_phone or "",
        "emergency_contact_relationship": r.emergency_contact_relationship or "",
        "physician_name": r.physician_name, "physician_phone": r.physician_phone,
        "last_updated": r.last_updated or date.today(),
    }


def _invoice_to_dict(r):
    return {
        "invoice_id": r.invoice_id, "campus_id": r.campus_id or "",
        "family_id": r.family_id or "", "invoice_number": r.invoice_number or "",
        "invoice_date": r.invoice_date or date.today(),
        "due_date": r.due_date or date.today(),
        "status": r.status or "Draft",
        "subtotal": r.subtotal or 0.0, "tax": r.tax or 0.0, "total": r.total or 0.0,
        "amount_paid": r.amount_paid or 0.0, "balance": r.balance or 0.0,
        "notes": r.notes,
        "created_date": r.created_date or datetime.utcnow(),
        "last_updated": r.last_updated or datetime.utcnow(),
    }


def _invoice_line_to_dict(r):
    return {
        "line_item_id": r.line_item_id, "invoice_id": r.invoice_id or "",
        "description": r.description or "", "category": r.category or "Tuition",
        "student_id": r.student_id, "quantity": r.quantity or 1,
        "unit_price": r.unit_price or 0.0, "total": r.total or 0.0,
        "funding_source": r.funding_source,
    }


def _payment_plan_to_dict(r):
    return {
        "payment_plan_id": r.payment_plan_id, "campus_id": r.campus_id or "",
        "family_id": r.family_id or "", "plan_name": r.plan_name or "",
        "total_amount": r.total_amount or 0.0, "amount_paid": r.amount_paid or 0.0,
        "balance": r.balance or 0.0,
        "start_date": r.start_date or date.today(), "end_date": r.end_date or date.today(),
        "status": r.status or "Active",
        "created_date": r.created_date or datetime.utcnow(),
        "last_updated": r.last_updated or datetime.utcnow(),
    }


def _payment_schedule_to_dict(r):
    return {
        "schedule_id": r.schedule_id,
        "payment_plan_id": r.payment_plan_id or "",
        "installment_number": r.installment_number or 0,
        "due_date": r.due_date or date.today(),
        "amount": r.amount or 0.0, "paid": r.paid or False,
        "paid_date": r.paid_date, "paid_amount": r.paid_amount or 0.0,
    }


def _lead_to_dict(r):
    return {
        "lead_id": r.lead_id, "campus_id": r.campus_id or "",
        "parent_first_name": r.parent_first_name or "",
        "parent_last_name": r.parent_last_name or "",
        "email": r.email or "", "phone": r.phone or "",
        "child_first_name": r.child_first_name or "",
        "child_last_name": r.child_last_name or "",
        "child_dob": r.child_dob or date(2018, 1, 1),
        "desired_grade": r.desired_grade or "K",
        "desired_start_date": r.desired_start_date or date(2025, 8, 15),
        "stage": r.stage or "New Inquiry", "source": r.source or "Website",
        "created_date": r.created_date or date.today(),
        "last_contact_date": r.last_contact_date,
        "tour_date": r.tour_date, "notes": r.notes or "",
        "assigned_to": r.assigned_to,
    }


def _capacity_to_dict(r):
    return {
        "campus_id": r.campus_id or "",
        "grade": r.grade or "K", "session": r.session or "Morning",
        "total_capacity": r.total_capacity or 0,
        "current_enrollment": r.current_enrollment or 0,
        "waitlist_count": r.waitlist_count or 0,
    }


def _template_to_dict(r):
    return {
        "template_id": r.template_id, "name": r.name or "",
        "trigger_type": r.trigger_type or "Attendance Alert",
        "communication_type": r.communication_type or "Email",
        "subject": r.subject or "", "body": r.body or "",
        "active": r.active if r.active is not None else True,
        "created_date": r.created_date or date.today(),
    }


def _broadcast_to_dict(r):
    return {
        "broadcast_id": r.broadcast_id, "campus_id": r.campus_id,
        "sender_id": r.sender_id or "", "communication_type": r.communication_type or "Email",
        "subject": r.subject or "", "body": r.body or "",
        "recipient_type": r.recipient_type or "",
        "recipient_count": r.recipient_count or 0,
        "status": r.status or "Draft",
        "scheduled_date": r.scheduled_date, "sent_date": r.sent_date,
        "created_date": r.created_date or date.today(),
    }


def _alert_to_dict(r):
    return {
        "alert_id": r.alert_id,
        "trigger_type": r.trigger_type or "Attendance Alert",
        "student_id": r.student_id or "", "family_id": r.family_id or "",
        "triggered_date": r.triggered_date or date.today(),
        "message_sent": r.message_sent or False,
        "message_content": r.message_content or "",
        "communication_type": r.communication_type or "Email",
    }


def _standard_to_dict(r):
    return {
        "standard_id": r.standard_id, "subject": r.subject or "",
        "grade": r.grade or "K", "code": r.code or "",
        "description": r.description or "", "category": r.category or "",
    }


def _assessment_to_dict(r):
    return {
        "assessment_id": r.assessment_id, "student_id": r.student_id or "",
        "standard_id": r.standard_id or "",
        "mastery_level": r.mastery_level or "Developing",
        "assessment_date": r.assessment_date or date.today(),
        "notes": r.notes, "teacher_id": r.teacher_id,
    }


def _progress_report_to_dict(r):
    return {
        "report_id": r.report_id, "student_id": r.student_id or "",
        "term": r.term or "Current Term",
        "generated_date": r.generated_date or date.today(),
        "standards_assessed": r.standards_assessed or 0,
        "proficient_count": r.proficient_count or 0,
        "developing_count": r.developing_count or 0,
        "beginning_count": r.beginning_count or 0,
        "overall_progress": r.overall_progress or "On Track",
    }


def _iep_to_dict(r):
    return {
        "plan_id": r.plan_id, "student_id": r.student_id or "",
        "campus_id": r.campus_id or "", "plan_type": r.plan_type or "IEP",
        "status": r.status or "Draft",
        "start_date": r.start_date or date.today(),
        "end_date": r.end_date, "case_manager": r.case_manager or "",
        "disability_category": r.disability_category or "",
        "meeting_date": r.meeting_date, "next_review_date": r.next_review_date,
        "parent_consent_date": r.parent_consent_date, "notes": r.notes,
    }


def _accommodation_to_dict(r):
    return {
        "accommodation_id": r.accommodation_id, "plan_id": r.plan_id or "",
        "type": r.type or "Testing", "description": r.description or "",
        "frequency": r.frequency or "", "responsible_staff": r.responsible_staff or "",
        "implementation_notes": r.implementation_notes,
    }


def _iep_goal_to_dict(r):
    return {
        "goal_id": r.goal_id, "plan_id": r.plan_id or "",
        "area": r.area or "", "goal_description": r.goal_description or "",
        "baseline": r.baseline or "", "target": r.target or "",
        "target_date": r.target_date, "status": r.status or "Not Started",
        "progress_percentage": r.progress_percentage or 0,
        "last_updated": r.last_updated,
    }


def _intervention_to_dict(r):
    return {
        "intervention_id": r.intervention_id, "student_id": r.student_id or "",
        "campus_id": r.campus_id or "", "tier": r.tier or "Tier 1",
        "area_of_concern": r.area_of_concern or "",
        "intervention_strategy": r.intervention_strategy or "",
        "start_date": r.start_date or date.today(), "end_date": r.end_date,
        "frequency": r.frequency or "", "duration_minutes": r.duration_minutes or 0,
        "staff_responsible": r.staff_responsible or "",
        "status": r.status or "Active",
        "baseline_data": r.baseline_data or "", "target_goal": r.target_goal or "",
    }


def _intervention_progress_to_dict(r):
    return {
        "progress_id": r.progress_id, "intervention_id": r.intervention_id or "",
        "date": r.date or date.today(), "data_point": r.data_point or 0.0,
        "notes": r.notes, "staff_id": r.staff_id,
    }


def _at_risk_to_dict(r):
    return {
        "assessment_id": r.assessment_id, "student_id": r.student_id or "",
        "campus_id": r.campus_id or "",
        "assessment_date": r.assessment_date or date.today(),
        "overall_risk_score": r.overall_risk_score or 0,
        "overall_risk_level": r.overall_risk_level or "Low",
        "academic_score": r.academic_score or 0,
        "attendance_score": r.attendance_score or 0,
        "behavior_score": r.behavior_score or 0,
        "engagement_score": r.engagement_score or 0,
        "risk_factors": _json_loads(r.risk_factors),
        "recommended_interventions": _json_loads(r.recommended_interventions),
        "assessed_by": r.assessed_by,
    }


def _retention_to_dict(r):
    return {
        "prediction_id": r.prediction_id, "student_id": r.student_id or "",
        "campus_id": r.campus_id or "", "school_year": r.school_year or "",
        "retention_probability": r.retention_probability or 0.0,
        "risk_level": r.risk_level or "Low",
        "key_factors": _json_loads(r.key_factors),
        "recommended_actions": _json_loads(r.recommended_actions),
        "last_updated": r.last_updated,
    }


def _forecast_to_dict(r):
    return {
        "forecast_id": r.forecast_id, "campus_id": r.campus_id or "",
        "school_year": r.school_year or "", "grade_level": r.grade_level or "K",
        "forecasted_enrollment": r.forecasted_enrollment or 0,
        "confidence_interval_low": r.confidence_interval_low or 0,
        "confidence_interval_high": r.confidence_interval_high or 0,
        "based_on_factors": _json_loads(r.based_on_factors),
        "generated_date": r.generated_date or date.today(),
    }


def _assignment_to_dict(r):
    return {
        "assignment_id": r.assignment_id, "campus_id": r.campus_id,
        "teacher_id": r.teacher_id, "room": r.room,
        "subject": r.subject or "", "assignment_type": r.assignment_type or "Homework",
        "title": r.title, "description": r.description,
        "max_points": r.max_points or 100,
        "due_date": r.due_date or date.today(),
        "status": r.status or "Draft",
        "created_date": r.created_date or date.today(),
    }


def _grade_entry_to_dict(r):
    return {
        "entry_id": r.entry_id, "assignment_id": r.assignment_id or "",
        "student_id": r.student_id or "", "campus_id": r.campus_id,
        "points_earned": r.points_earned, "letter_grade": r.letter_grade,
        "percentage": r.percentage, "status": r.status or "Missing",
        "comment": r.comment, "submitted_date": r.submitted_date,
        "graded_date": r.graded_date, "graded_by": r.graded_by,
    }


def _announcement_to_dict(r):
    return {
        "announcement_id": r.announcement_id, "campus_id": r.campus_id,
        "title": r.title or "", "content": r.content or "",
        "category": r.category or "General",
        "status": r.status or "Draft",
        "created_by": r.created_by or "", "created_by_role": r.created_by_role or "Teacher",
        "approved_by": r.approved_by, "approved_date": r.approved_date,
        "published_date": r.published_date, "expires_date": r.expires_date,
        "is_pinned": r.is_pinned or False,
        "target_roles": _json_loads(r.target_roles),
    }


def _announcement_read_to_dict(r):
    return {
        "read_id": r.read_id, "announcement_id": r.announcement_id or "",
        "user_id": r.user_id or "", "read_date": r.read_date or date.today(),
    }


def _workflow_to_dict(r):
    return {
        "workflow_id": r.workflow_id, "event_id": r.event_id or "",
        "rsvp_id": r.rsvp_id or "", "family_id": r.family_id or "",
        "student_id": r.student_id or "", "status": r.status or "Pending",
        "permission_slip_signed": r.permission_slip_signed or False,
        "permission_slip_signature_id": r.permission_slip_signature_id,
        "payment_complete": r.payment_complete or False,
        "payment_order_id": r.payment_order_id,
        "created_date": r.created_date or date.today(),
        "completed_date": r.completed_date,
    }


def _sufs_scholarship_to_dict(r):
    return {
        "scholarship_id": r.scholarship_id, "student_id": r.student_id or "",
        "family_id": r.family_id or "", "campus_id": r.campus_id or "",
        "scholarship_type": r.scholarship_type or "FES-UA",
        "award_id": r.award_id, "school_year": r.school_year or "",
        "annual_award_amount": r.annual_award_amount or 0.0,
        "quarterly_amount": r.quarterly_amount or 0.0,
        "remaining_balance": r.remaining_balance or 0.0,
        "start_date": r.start_date or date.today(),
        "end_date": r.end_date,
        "status": r.status or "Active",
        "eligibility_verified": r.eligibility_verified or False,
        "eligibility_verified_date": r.eligibility_verified_date,
        "notes": r.notes,
        "created_date": r.created_date or date.today(),
        "last_updated": r.last_updated or date.today(),
    }


def _sufs_claim_to_dict(r):
    return {
        "claim_id": r.claim_id, "scholarship_id": r.scholarship_id or "",
        "student_id": r.student_id or "", "family_id": r.family_id or "",
        "campus_id": r.campus_id or "",
        "claim_period": r.claim_period or "",
        "claim_date": r.claim_date or date.today(),
        "amount_claimed": r.amount_claimed or 0.0,
        "tuition_amount": r.tuition_amount or 0.0,
        "fees_amount": r.fees_amount or 0.0,
        "status": r.status or "Draft",
        "submitted_date": r.submitted_date, "approved_date": r.approved_date,
        "paid_date": r.paid_date, "paid_amount": r.paid_amount,
        "denial_reason": r.denial_reason,
        "sufs_reference_number": r.sufs_reference_number,
        "notes": r.notes,
        "created_date": r.created_date or date.today(),
        "last_updated": r.last_updated or date.today(),
    }


def _sufs_payment_to_dict(r):
    return {
        "payment_id": r.payment_id, "campus_id": r.campus_id or "",
        "payment_date": r.payment_date or date.today(),
        "deposit_date": r.deposit_date,
        "total_amount": r.total_amount or 0.0,
        "sufs_reference_number": r.sufs_reference_number,
        "bank_reference": r.bank_reference,
        "status": r.status or "Pending",
        "reconciled_date": r.reconciled_date, "reconciled_by": r.reconciled_by,
        "notes": r.notes,
        "created_date": r.created_date or date.today(),
    }


def _sufs_allocation_to_dict(r):
    return {
        "allocation_id": r.allocation_id, "payment_id": r.payment_id or "",
        "claim_id": r.claim_id or "", "student_id": r.student_id or "",
        "family_id": r.family_id or "", "amount": r.amount or 0.0,
        "status": r.status or "", "discrepancy_amount": r.discrepancy_amount,
        "discrepancy_reason": r.discrepancy_reason,
        "created_date": r.created_date or date.today(),
    }


# ============================================================================
# Seed from demo_data.py into the database
# ============================================================================

def seed_from_demo_data():
    """
    Generate demo data using demo_data.py and save it all to the database.
    This is called when the database is empty on first startup.
    """
    from .demo_data import generate_all_demo_data

    data = generate_all_demo_data()
    db = SessionLocal()

    try:
        # Helper to save a list of Pydantic models as SQLAlchemy rows
        def _save_list(pydantic_list, converter_fn):
            for item in pydantic_list:
                d = converter_fn(item)
                db.add(d)

        # Organizations
        for item in data.get("organizations", []):
            db.add(models.Organization(
                organization_id=item.organization_id, name=item.name,
                created_date=item.created_date))

        # Campuses
        for item in data.get("campuses", []):
            db.add(models.Campus(
                campus_id=item.campus_id, organization_id=item.organization_id,
                name=item.name, location=item.location,
                address=getattr(item, 'address', None),
                phone=getattr(item, 'phone', None),
                email=getattr(item, 'email', None),
                active=item.active))

        # Users
        for item in data.get("users", []):
            db.add(models.User(
                user_id=item.user_id, email=item.email,
                password_hash=item.password_hash,
                first_name=item.first_name, last_name=item.last_name,
                role=_enum_val(item.role),
                campus_ids=_json_dumps(item.campus_ids),
                active=item.active, created_date=item.created_date,
                last_login=item.last_login))

        # Staff
        for item in data.get("staff", []):
            db.add(models.Staff(
                staff_id=item.staff_id,
                campus_id=item.campus_ids[0] if item.campus_ids else None,
                campus_ids=_json_dumps(item.campus_ids),
                first_name=item.first_name, last_name=item.last_name,
                role=_enum_val(item.role), email=item.email,
                assigned_rooms=_json_dumps(item.assigned_rooms),
                permissions=item.permissions, active=True))

        # Families
        for item in data.get("families", []):
            db.add(models.Family(
                family_id=item.family_id, family_name=item.family_name,
                primary_parent_id=item.primary_parent_id,
                monthly_tuition_amount=item.monthly_tuition_amount,
                current_balance=item.current_balance,
                billing_status=_enum_val(item.billing_status),
                last_payment_date=item.last_payment_date,
                last_payment_amount=item.last_payment_amount))

        # Parents
        for item in data.get("parents", []):
            # Find family_id for this parent
            family_id = None
            for fam in data.get("families", []):
                if item.parent_id in fam.parent_ids:
                    family_id = fam.family_id
                    break
            db.add(models.Parent(
                parent_id=item.parent_id, family_id=family_id,
                first_name=item.first_name, last_name=item.last_name,
                email=item.email, phone=item.phone,
                relationship_type=item.relationship,
                primary_guardian=item.primary_guardian,
                preferred_contact_method=item.preferred_contact_method))

        # Students
        for item in data.get("students", []):
            db.add(models.Student(
                student_id=item.student_id, campus_id=item.campus_id,
                first_name=item.first_name, last_name=item.last_name,
                date_of_birth=item.date_of_birth,
                grade=_enum_val(item.grade) if hasattr(item.grade, 'value') else item.grade,
                session=_enum_val(item.session), room=_enum_val(item.room),
                status=_enum_val(item.status), family_id=item.family_id,
                enrollment_start_date=item.enrollment_start_date,
                enrollment_end_date=item.enrollment_end_date,
                attendance_present_count=item.attendance_present_count,
                attendance_absent_count=item.attendance_absent_count,
                attendance_tardy_count=item.attendance_tardy_count,
                overall_grade_flag=_enum_val(item.overall_grade_flag),
                ixl_status_flag=_enum_val(item.ixl_status_flag),
                overall_risk_flag=_enum_val(item.overall_risk_flag),
                funding_source=_enum_val(item.funding_source),
                step_up_percentage=item.step_up_percentage))

        # Grade records
        for item in data.get("grade_records", []):
            db.add(models.GradeRecord(
                grade_record_id=item.grade_record_id, campus_id=item.campus_id,
                student_id=item.student_id, subject=item.subject,
                term=item.term, grade_value=item.grade_value,
                is_failing=item.is_failing))

        # Behavior notes
        for item in data.get("behavior_notes", []):
            db.add(models.BehaviorNote(
                behavior_note_id=item.behavior_note_id, campus_id=item.campus_id,
                student_id=item.student_id, date=item.date,
                type=_enum_val(item.type), summary=item.summary,
                flag_for_followup=item.flag_for_followup))

        # Attendance records
        for item in data.get("attendance_records", []):
            db.add(models.AttendanceRecord(
                attendance_id=item.attendance_id, campus_id=item.campus_id,
                student_id=item.student_id, date=item.date,
                status=_enum_val(item.status), session=_enum_val(item.session)))

        # IXL summaries
        for item in data.get("ixl_summaries", []):
            db.add(models.IXLSummary(
                ixl_summary_id=item.ixl_summary_id, student_id=item.student_id,
                week_start_date=item.week_start_date, weekly_hours=item.weekly_hours,
                skills_practiced_this_week=item.skills_practiced_this_week,
                skills_mastered_total=item.skills_mastered_total,
                math_proficiency=_enum_val(item.math_proficiency),
                ela_proficiency=_enum_val(item.ela_proficiency),
                last_active_date=item.last_active_date,
                recent_skills=_json_dumps(item.recent_skills)))

        # Acellus courses
        for item in data.get("acellus_courses", []):
            db.add(models.AcellusCourse(
                course_id=item.course_id, student_id=item.student_id,
                course_name=item.course_name, subject=item.subject,
                total_steps=item.total_steps, completed_steps=item.completed_steps,
                completion_percentage=item.completion_percentage,
                current_grade=item.current_grade,
                grade_percentage=item.grade_percentage,
                status=_enum_val(item.status),
                last_activity_date=item.last_activity_date,
                time_spent_hours=item.time_spent_hours))

        # Acellus summaries
        for item in data.get("acellus_summaries", []):
            db.add(models.AcellusSummary(
                acellus_summary_id=item.acellus_summary_id,
                student_id=item.student_id,
                total_courses=item.total_courses,
                courses_on_track=item.courses_on_track,
                courses_behind=item.courses_behind,
                overall_gpa=item.overall_gpa,
                total_time_spent_hours=item.total_time_spent_hours,
                last_active_date=item.last_active_date,
                overall_status=_enum_val(item.overall_status)))

        # Billing records
        for item in data.get("billing_records", []):
            db.add(models.BillingRecord(
                billing_record_id=item.billing_record_id,
                campus_id=item.campus_id, family_id=item.family_id,
                date=item.date, type=item.type,
                description=item.description, amount=item.amount,
                source=_enum_val(item.source) if item.source else None,
                period_month=item.period_month,
                category=_enum_val(item.category) if item.category else None,
                student_id=item.student_id))

        # Conferences
        for item in data.get("conferences", []):
            db.add(models.Conference(
                conference_id=item.conference_id, student_id=item.student_id,
                parent_id=item.parent_id, staff_id=item.staff_id,
                date_time=item.date_time, location=item.location,
                status=_enum_val(item.status), notes=item.notes))

        # Messages
        for item in data.get("messages", []):
            db.add(models.Message(
                message_id=item.message_id,
                sender_type=_enum_val(item.sender_type),
                sender_id=item.sender_id,
                recipient_type=_enum_val(item.recipient_type),
                recipient_id=item.recipient_id,
                student_id=item.student_id,
                content_preview=item.content_preview,
                date_time=item.date_time))

        # Events
        for item in data.get("events", []):
            db.add(models.Event(
                event_id=item.event_id, campus_id=item.campus_id,
                title=item.title, description=item.description,
                event_type=_enum_val(item.event_type),
                date=item.date, time=item.time, location=item.location,
                requires_rsvp=item.requires_rsvp,
                requires_permission_slip=item.requires_permission_slip,
                requires_payment=item.requires_payment,
                payment_amount=item.payment_amount,
                created_by_staff_id=item.created_by_staff_id))

        # Event RSVPs
        for item in data.get("event_rsvps", []):
            db.add(models.EventRSVP(
                rsvp_id=item.rsvp_id, event_id=item.event_id,
                family_id=item.family_id, parent_id=item.parent_id,
                student_ids=_json_dumps(item.student_ids),
                status=_enum_val(item.status),
                response_date=item.response_date))

        # Documents
        for item in data.get("documents", []):
            db.add(models.Document(
                document_id=item.document_id, campus_id=item.campus_id,
                title=item.title, document_type=_enum_val(item.document_type),
                description=item.description, required_for=item.required_for,
                status=_enum_val(item.status), created_date=item.created_date,
                expiration_date=item.expiration_date, file_url=item.file_url))

        # Document signatures
        for item in data.get("document_signatures", []):
            db.add(models.DocumentSignature(
                signature_id=item.signature_id, document_id=item.document_id,
                parent_id=item.parent_id, student_id=item.student_id,
                signed_date=item.signed_date, signature_data=item.signature_data))

        # Products
        for item in data.get("products", []):
            db.add(models.Product(
                product_id=item.product_id, name=item.name,
                description=item.description,
                category=_enum_val(item.category),
                price=item.price, image_url=item.image_url,
                available=item.available))

        # Orders
        for item in data.get("orders", []):
            db.add(models.Order(
                order_id=item.order_id, family_id=item.family_id,
                parent_id=item.parent_id,
                items=_json_dumps(item.items),
                total_amount=item.total_amount,
                status=_enum_val(item.status),
                order_date=item.order_date, payment_date=item.payment_date))

        # Photo albums
        for item in data.get("photo_albums", []):
            db.add(models.PhotoAlbum(
                album_id=item.album_id, campus_id=item.campus_id,
                title=item.title, description=item.description,
                created_by_staff_id=item.created_by_staff_id,
                created_date=item.created_date,
                status=_enum_val(item.status),
                photo_urls=_json_dumps(item.photo_urls),
                visible_to_grades=_json_dumps(item.visible_to_grades)))

        # Incidents
        for item in data.get("incidents", []):
            db.add(models.Incident(
                incident_id=item.incident_id, campus_id=item.campus_id,
                student_id=item.student_id,
                reported_by_staff_id=item.reported_by_staff_id,
                incident_type=_enum_val(item.incident_type),
                severity=_enum_val(item.severity),
                date=item.date, time=item.time,
                description=item.description,
                action_taken=item.action_taken,
                parent_notified=item.parent_notified,
                followup_required=item.followup_required))

        # Health records
        for item in data.get("health_records", []):
            db.add(models.HealthRecord(
                health_record_id=item.health_record_id,
                campus_id=item.campus_id, student_id=item.student_id,
                allergies=_json_dumps(item.allergies),
                medications=_json_dumps(item.medications),
                medical_conditions=_json_dumps(item.medical_conditions),
                emergency_contact_name=item.emergency_contact_name,
                emergency_contact_phone=item.emergency_contact_phone,
                emergency_contact_relationship=item.emergency_contact_relationship,
                physician_name=item.physician_name,
                physician_phone=item.physician_phone,
                last_updated=item.last_updated))

        # Invoices
        for item in data.get("invoices", []):
            db.add(models.Invoice(
                invoice_id=item.invoice_id, campus_id=item.campus_id,
                family_id=item.family_id, invoice_number=item.invoice_number,
                invoice_date=item.invoice_date, due_date=item.due_date,
                status=_enum_val(item.status),
                subtotal=item.subtotal, tax=item.tax, total=item.total,
                amount_paid=item.amount_paid, balance=item.balance,
                notes=item.notes, created_date=item.created_date,
                last_updated=item.last_updated))

        # Invoice line items
        for item in data.get("invoice_line_items", []):
            db.add(models.InvoiceLineItem(
                line_item_id=item.line_item_id, invoice_id=item.invoice_id,
                description=item.description,
                category=_enum_val(item.category),
                student_id=item.student_id, quantity=item.quantity,
                unit_price=item.unit_price, total=item.total,
                funding_source=_enum_val(item.funding_source) if item.funding_source else None))

        # Payment plans
        for item in data.get("payment_plans", []):
            db.add(models.PaymentPlan(
                payment_plan_id=item.payment_plan_id,
                campus_id=item.campus_id, family_id=item.family_id,
                plan_name=item.plan_name, total_amount=item.total_amount,
                amount_paid=item.amount_paid, balance=item.balance,
                start_date=item.start_date, end_date=item.end_date,
                status=_enum_val(item.status),
                created_date=item.created_date, last_updated=item.last_updated))

        # Payment schedules
        for item in data.get("payment_schedules", []):
            db.add(models.PaymentSchedule(
                schedule_id=item.schedule_id,
                payment_plan_id=item.payment_plan_id,
                installment_number=item.installment_number,
                due_date=item.due_date, amount=item.amount,
                paid=item.paid, paid_date=item.paid_date,
                paid_amount=item.paid_amount))

        # Leads
        for item in data.get("leads", []):
            db.add(models.Lead(
                lead_id=item.lead_id, campus_id=item.campus_id,
                parent_first_name=item.parent_first_name,
                parent_last_name=item.parent_last_name,
                email=item.email, phone=item.phone,
                child_first_name=item.child_first_name,
                child_last_name=item.child_last_name,
                child_dob=item.child_dob, desired_grade=item.desired_grade,
                desired_start_date=item.desired_start_date,
                stage=_enum_val(item.stage), source=_enum_val(item.source),
                created_date=item.created_date,
                last_contact_date=item.last_contact_date,
                tour_date=item.tour_date, notes=item.notes,
                assigned_to=item.assigned_to))

        # Campus capacity
        for item in data.get("campus_capacity", []):
            db.add(models.CampusCapacity(
                campus_id=item.campus_id,
                grade=item.grade, session=_enum_val(item.session),
                total_capacity=item.total_capacity,
                current_enrollment=item.current_enrollment,
                waitlist_count=item.waitlist_count))

        # Message templates
        for item in data.get("message_templates", []):
            db.add(models.MessageTemplate(
                template_id=item.template_id, name=item.name,
                trigger_type=_enum_val(item.trigger_type),
                communication_type=_enum_val(item.communication_type),
                subject=item.subject, body=item.body,
                active=item.active, created_date=item.created_date))

        # Broadcast messages
        for item in data.get("broadcast_messages", []):
            db.add(models.BroadcastMessage(
                broadcast_id=item.broadcast_id, campus_id=item.campus_id,
                sender_id=item.sender_id,
                communication_type=_enum_val(item.communication_type),
                subject=item.subject, body=item.body,
                recipient_type=item.recipient_type,
                recipient_count=item.recipient_count,
                status=_enum_val(item.status),
                scheduled_date=item.scheduled_date, sent_date=item.sent_date,
                created_date=item.created_date))

        # Automated alerts
        for item in data.get("automated_alerts", []):
            db.add(models.AutomatedAlert(
                alert_id=item.alert_id,
                trigger_type=_enum_val(item.trigger_type),
                student_id=item.student_id, family_id=item.family_id,
                triggered_date=item.triggered_date,
                message_sent=item.message_sent,
                message_content=item.message_content,
                communication_type=_enum_val(item.communication_type)))

        # Academic standards
        for item in data.get("academic_standards", []):
            db.add(models.AcademicStandard(
                standard_id=item.standard_id, subject=item.subject,
                grade=item.grade, code=item.code,
                description=item.description, category=item.category))

        # Standard assessments
        for item in data.get("standard_assessments", []):
            db.add(models.StandardAssessment(
                assessment_id=item.assessment_id, student_id=item.student_id,
                standard_id=item.standard_id,
                mastery_level=_enum_val(item.mastery_level),
                assessment_date=item.assessment_date,
                notes=item.notes, teacher_id=item.teacher_id))

        # Progress reports
        for item in data.get("progress_reports", []):
            db.add(models.ProgressReport(
                report_id=item.report_id, student_id=item.student_id,
                term=item.term, generated_date=item.generated_date,
                standards_assessed=item.standards_assessed,
                proficient_count=item.proficient_count,
                developing_count=item.developing_count,
                beginning_count=item.beginning_count,
                overall_progress=item.overall_progress))

        # IEP/504 plans
        for item in data.get("iep_504_plans", []):
            db.add(models.IEP504Plan(
                plan_id=item.plan_id, student_id=item.student_id,
                campus_id=item.campus_id,
                plan_type=_enum_val(item.plan_type),
                status=_enum_val(item.status),
                start_date=item.start_date, end_date=item.end_date,
                case_manager=item.case_manager,
                disability_category=item.disability_category,
                meeting_date=item.meeting_date,
                next_review_date=item.next_review_date,
                parent_consent_date=item.parent_consent_date,
                notes=item.notes))

        # Accommodations
        for item in data.get("accommodations", []):
            db.add(models.Accommodation(
                accommodation_id=item.accommodation_id, plan_id=item.plan_id,
                type=_enum_val(item.type), description=item.description,
                frequency=item.frequency,
                responsible_staff=item.responsible_staff,
                implementation_notes=item.implementation_notes))

        # IEP Goals
        for item in data.get("iep_goals", []):
            db.add(models.IEPGoal(
                goal_id=item.goal_id, plan_id=item.plan_id,
                area=item.area, goal_description=item.goal_description,
                baseline=item.baseline, target=item.target,
                target_date=item.target_date,
                status=_enum_val(item.status),
                progress_percentage=item.progress_percentage,
                last_updated=item.last_updated))

        # Intervention plans
        for item in data.get("intervention_plans", []):
            db.add(models.InterventionPlan(
                intervention_id=item.intervention_id,
                student_id=item.student_id, campus_id=item.campus_id,
                tier=_enum_val(item.tier),
                area_of_concern=item.area_of_concern,
                intervention_strategy=item.intervention_strategy,
                start_date=item.start_date, end_date=item.end_date,
                frequency=item.frequency,
                duration_minutes=item.duration_minutes,
                staff_responsible=item.staff_responsible,
                status=_enum_val(item.status),
                baseline_data=item.baseline_data,
                target_goal=item.target_goal))

        # Intervention progress
        for item in data.get("intervention_progress", []):
            db.add(models.InterventionProgress(
                progress_id=item.progress_id,
                intervention_id=item.intervention_id,
                date=item.date, data_point=item.data_point,
                notes=item.notes, staff_id=item.staff_id))

        # At-risk assessments
        for item in data.get("at_risk_assessments", []):
            db.add(models.AtRiskAssessment(
                assessment_id=item.assessment_id,
                student_id=item.student_id, campus_id=item.campus_id,
                assessment_date=item.assessment_date,
                overall_risk_score=item.overall_risk_score,
                overall_risk_level=_enum_val(item.overall_risk_level),
                academic_score=item.academic_score,
                attendance_score=item.attendance_score,
                behavior_score=item.behavior_score,
                engagement_score=item.engagement_score,
                risk_factors=_json_dumps(item.risk_factors),
                recommended_interventions=_json_dumps(item.recommended_interventions),
                assessed_by=item.assessed_by))

        # Retention predictions
        for item in data.get("retention_predictions", []):
            db.add(models.RetentionPrediction(
                prediction_id=item.prediction_id,
                student_id=item.student_id, campus_id=item.campus_id,
                school_year=item.school_year,
                retention_probability=item.retention_probability,
                risk_level=_enum_val(item.risk_level),
                key_factors=_json_dumps(item.key_factors),
                recommended_actions=_json_dumps(item.recommended_actions),
                last_updated=item.last_updated))

        # Enrollment forecasts
        for item in data.get("enrollment_forecasts", []):
            db.add(models.EnrollmentForecast(
                forecast_id=item.forecast_id, campus_id=item.campus_id,
                school_year=item.school_year,
                grade_level=item.grade_level,
                forecasted_enrollment=item.forecasted_enrollment,
                confidence_interval_low=item.confidence_interval_low,
                confidence_interval_high=item.confidence_interval_high,
                based_on_factors=_json_dumps(item.based_on_factors),
                generated_date=item.generated_date))

        # Assignments
        for item in data.get("assignments", []):
            db.add(models.Assignment(
                assignment_id=item.assignment_id,
                campus_id=getattr(item, 'campus_id', None),
                teacher_id=getattr(item, 'teacher_id', None),
                room=getattr(item, 'room', None),
                subject=item.subject,
                assignment_type=_enum_val(item.assignment_type),
                title=item.title,
                description=getattr(item, 'description', None),
                max_points=item.max_points, due_date=item.due_date,
                status=_enum_val(item.status),
                created_date=getattr(item, 'created_date', None)))

        # Grade entries
        for item in data.get("grade_entries", []):
            db.add(models.GradeEntry(
                entry_id=item.entry_id, assignment_id=item.assignment_id,
                student_id=item.student_id,
                campus_id=getattr(item, 'campus_id', None),
                points_earned=getattr(item, 'points_earned', None),
                letter_grade=getattr(item, 'letter_grade', None),
                percentage=getattr(item, 'percentage', None),
                status=_enum_val(item.status),
                comment=getattr(item, 'comment', None),
                submitted_date=getattr(item, 'submitted_date', None),
                graded_date=getattr(item, 'graded_date', None),
                graded_by=getattr(item, 'graded_by', None)))

        # Announcements
        for item in data.get("announcements", []):
            db.add(models.Announcement(
                announcement_id=item.announcement_id,
                campus_id=getattr(item, 'campus_id', None),
                title=item.title, content=item.content,
                category=_enum_val(item.category),
                status=_enum_val(item.status),
                created_by=getattr(item, 'created_by', None),
                created_by_role=getattr(item, 'created_by_role', None),
                approved_by=getattr(item, 'approved_by', None),
                approved_date=getattr(item, 'approved_date', None),
                published_date=getattr(item, 'published_date', None),
                expires_date=getattr(item, 'expires_date', None),
                is_pinned=getattr(item, 'is_pinned', False),
                target_roles=_json_dumps(getattr(item, 'target_roles', [])),
                created_date=getattr(item, 'created_date', None),
                target_audience=getattr(item, 'target_audience', None)))

        # Announcement reads
        for item in data.get("announcement_reads", []):
            db.add(models.AnnouncementRead(
                read_id=item.read_id, announcement_id=item.announcement_id,
                user_id=item.user_id, read_date=item.read_date))

        # Event workflows
        for item in data.get("event_workflows", []):
            db.add(models.EventWorkflow(
                workflow_id=item.workflow_id, event_id=item.event_id,
                rsvp_id=item.rsvp_id, family_id=item.family_id,
                student_id=item.student_id,
                status=_enum_val(item.status),
                permission_slip_signed=item.permission_slip_signed,
                permission_slip_signature_id=item.permission_slip_signature_id,
                payment_complete=item.payment_complete,
                payment_order_id=item.payment_order_id,
                created_date=item.created_date,
                completed_date=item.completed_date))

        # SUFS Scholarships
        for item in data.get("sufs_scholarships", []):
            db.add(models.SUFSScholarship(
                scholarship_id=item.scholarship_id,
                student_id=item.student_id, family_id=item.family_id,
                campus_id=item.campus_id,
                scholarship_type=_enum_val(item.scholarship_type),
                award_id=item.award_id, school_year=item.school_year,
                annual_award_amount=item.annual_award_amount,
                quarterly_amount=item.quarterly_amount,
                remaining_balance=item.remaining_balance,
                start_date=item.start_date, end_date=item.end_date,
                status=_enum_val(item.status) if hasattr(item.status, 'value') else item.status,
                eligibility_verified=item.eligibility_verified,
                eligibility_verified_date=item.eligibility_verified_date,
                notes=item.notes, created_date=item.created_date,
                last_updated=item.last_updated))

        # SUFS Claims
        for item in data.get("sufs_claims", []):
            db.add(models.SUFSClaim(
                claim_id=item.claim_id, scholarship_id=item.scholarship_id,
                student_id=item.student_id, family_id=item.family_id,
                campus_id=item.campus_id, claim_period=item.claim_period,
                claim_date=item.claim_date,
                amount_claimed=item.amount_claimed,
                tuition_amount=item.tuition_amount,
                fees_amount=item.fees_amount,
                status=_enum_val(item.status),
                submitted_date=item.submitted_date,
                approved_date=item.approved_date,
                paid_date=item.paid_date, paid_amount=item.paid_amount,
                denial_reason=item.denial_reason,
                sufs_reference_number=item.sufs_reference_number,
                notes=item.notes, created_date=item.created_date,
                last_updated=item.last_updated))

        # SUFS Payments
        for item in data.get("sufs_payments", []):
            db.add(models.SUFSPayment(
                payment_id=item.payment_id, campus_id=item.campus_id,
                payment_date=item.payment_date,
                deposit_date=item.deposit_date,
                total_amount=item.total_amount,
                sufs_reference_number=item.sufs_reference_number,
                bank_reference=item.bank_reference,
                status=_enum_val(item.status),
                reconciled_date=item.reconciled_date,
                reconciled_by=item.reconciled_by,
                notes=item.notes, created_date=item.created_date))

        # SUFS Payment Allocations
        for item in data.get("sufs_payment_allocations", []):
            db.add(models.SUFSPaymentAllocation(
                allocation_id=item.allocation_id,
                payment_id=item.payment_id, claim_id=item.claim_id,
                student_id=item.student_id, family_id=item.family_id,
                amount=item.amount, status=item.status,
                discrepancy_amount=item.discrepancy_amount,
                discrepancy_reason=item.discrepancy_reason,
                created_date=item.created_date))

        db.commit()
        print(f"Demo data seeded to database successfully")

    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data to database: {e}")
        raise
    finally:
        db.close()
