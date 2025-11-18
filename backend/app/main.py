from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date, timedelta
import random
from enum import Enum

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

class Student(BaseModel):
    student_id: str
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
    first_name: str
    last_name: str
    role: StaffRole
    email: str
    assigned_rooms: List[str]
    permissions: str

class GradeRecord(BaseModel):
    grade_record_id: str
    student_id: str
    subject: str
    term: str
    grade_value: str
    is_failing: bool

class BehaviorNote(BaseModel):
    behavior_note_id: str
    student_id: str
    date: date
    type: BehaviorType
    summary: str
    flag_for_followup: bool

class AttendanceRecord(BaseModel):
    attendance_id: str
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
    family_id: str
    date: date
    type: str
    description: str
    amount: float

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
    title: str
    document_type: DocumentType
    description: str
    required_for: str  # "All Students", "Grade K-5", specific student_id, etc.
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
    title: str
    description: str
    created_by_staff_id: str
    created_date: date
    status: PhotoAlbumStatus
    photo_urls: List[str]
    visible_to_grades: List[str]  # ["K", "1", "2"] or ["All"]

class Incident(BaseModel):
    incident_id: str
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

def generate_demo_data():
    """Generate demo data and populate in-memory databases"""
    global students_db, families_db, parents_db, staff_db, grade_records_db
    global behavior_notes_db, attendance_records_db, ixl_summaries_db
    global billing_records_db, conferences_db, messages_db
    global events_db, event_rsvps_db, documents_db, document_signatures_db
    global products_db, orders_db, photo_albums_db, incidents_db, health_records_db
    
    from .demo_data import generate_all_demo_data
    
    data = generate_all_demo_data()
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

@app.on_event("startup")
async def startup_event():
    generate_demo_data()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/students", response_model=List[Student])
async def get_students(
    grade: Optional[str] = None,
    session: Optional[Session] = None,
    room: Optional[Room] = None,
    billing_status: Optional[BillingStatus] = None,
    risk_flag: Optional[RiskFlag] = None,
    ixl_status: Optional[IXLStatus] = None
):
    filtered_students = students_db
    
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
async def get_admin_dashboard():
    total_students = len(students_db)
    morning_count = len([s for s in students_db if s.session == Session.MORNING])
    afternoon_count = len([s for s in students_db if s.session == Session.AFTERNOON])
    
    billing_green = len([f for f in families_db if f.billing_status == BillingStatus.GREEN])
    billing_yellow = len([f for f in families_db if f.billing_status == BillingStatus.YELLOW])
    billing_red = len([f for f in families_db if f.billing_status == BillingStatus.RED])
    total_balance = sum(f.current_balance for f in families_db)
    
    today = date.today()
    today_attendance = [a for a in attendance_records_db if a.date == today]
    present_today = len([a for a in today_attendance if a.status == AttendanceStatus.PRESENT])
    absent_today = len([a for a in today_attendance if a.status == AttendanceStatus.ABSENT])
    tardy_today = len([a for a in today_attendance if a.status == AttendanceStatus.TARDY])
    
    at_risk_students = [s for s in students_db if s.overall_risk_flag == RiskFlag.AT_RISK]
    ixl_behind = [s for s in students_db if s.ixl_status_flag == IXLStatus.NEEDS_ATTENTION]
    overdue_families = [f for f in families_db if f.billing_status == BillingStatus.RED]
    
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
