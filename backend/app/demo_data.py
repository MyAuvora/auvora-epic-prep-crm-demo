from datetime import date, datetime, timedelta
import random
from typing import List
from .main import (
    Organization, Campus, User, AuditLog,
    Student, Family, Parent, Staff, GradeRecord, BehaviorNote,
    AttendanceRecord, IXLSummary, BillingRecord, Conference, Message,
    Event, EventRSVP, Document, DocumentSignature, Product, Order,
    PhotoAlbum, Incident, HealthRecord,
    Session, Room, StudentStatus, BillingStatus, AttendanceStatus,
    GradeFlag, IXLStatus, RiskFlag, StaffRole, BehaviorType,
    ConferenceStatus, MessageSenderType, EventType, RSVPStatus,
    DocumentType, DocumentStatus, ProductCategory, OrderStatus,
    PhotoAlbumStatus, IncidentType, IncidentSeverity,
    FundingSource, PaymentSource, BillingCategory,
    UserRole, AuditAction
)

def generate_all_demo_data():
    """Generate all demo data and return as dictionaries"""
    
    organizations_db = []
    campuses_db = []
    users_db = []
    audit_logs_db = []
    
    org = Organization(
        organization_id="org_1",
        name="Epic Prep Academy",
        created_date=date(2020, 1, 1)
    )
    organizations_db.append(org)
    
    campus_data = [
        {"name": "Pace Campus", "location": "Pace, FL", "address": "123 School St, Pace, FL 32571", "phone": "850-555-0100"},
        {"name": "Crestview Campus", "location": "Crestview, FL", "address": "456 Education Ave, Crestview, FL 32536", "phone": "850-555-0200"},
        {"name": "Navarre Campus", "location": "Navarre, FL", "address": "789 Learning Ln, Navarre, FL 32566", "phone": "850-555-0300"}
    ]
    
    for i, campus_info in enumerate(campus_data):
        campus = Campus(
            campus_id=f"campus_{i+1}",
            organization_id=org.organization_id,
            name=campus_info["name"],
            location=campus_info["location"],
            address=campus_info["address"],
            phone=campus_info["phone"],
            email=f"{campus_info['location'].split(',')[0].lower()}@epicprepacademy.com",
            active=True
        )
        campuses_db.append(campus)
    
    users_db.append(User(
        user_id="user_1",
        email="admin@epicprepacademy.com",
        password_hash="demo_password_hash",
        first_name="Sarah",
        last_name="Mitchell",
        role=UserRole.SUPER_ADMIN,
        campus_ids=[c.campus_id for c in campuses_db],
        active=True,
        created_date=date(2024, 1, 1),
        last_login=datetime.now()
    ))
    
    campus_admin_names = [
        ("Jennifer", "Kilgore"),
        ("Brittany", "Kilcrease"),
        ("Pam", "Riffle")
    ]
    for i, (first, last) in enumerate(campus_admin_names):
        users_db.append(User(
            user_id=f"user_{i+2}",
            email=f"{first.lower()}.{last.lower()}@epicprepacademy.com",
            password_hash="demo_password_hash",
            first_name=first,
            last_name=last,
            role=UserRole.CAMPUS_ADMIN,
            campus_ids=[campuses_db[i].campus_id],
            active=True,
            created_date=date(2024, 1, 1),
            last_login=datetime.now() - timedelta(days=random.randint(0, 7))
        ))
    
    students_db = []
    families_db = []
    parents_db = []
    staff_db = []
    grade_records_db = []
    behavior_notes_db = []
    attendance_records_db = []
    ixl_summaries_db = []
    billing_records_db = []
    conferences_db = []
    messages_db = []
    
    first_names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William",
                   "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
                   "Abigail", "Michael", "Emily", "Daniel", "Elizabeth", "Matthew", "Sofia", "Jackson", "Avery", "Sebastian",
                   "Ella", "David", "Scarlett", "Joseph", "Grace", "Samuel", "Chloe", "John", "Victoria", "Owen",
                   "Riley", "Dylan", "Aria", "Luke", "Lily", "Gabriel", "Aubrey", "Anthony", "Zoey", "Isaac"]
    
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
                  "Lee", "Perez", "Thompson", "White", "Harris"]
    
    staff_data = [
        {"first_name": "Sarah", "last_name": "Mitchell", "role": StaffRole.OWNER, "rooms": [], "campus_idx": None},
        {"first_name": "Jennifer", "last_name": "Kilgore", "role": StaffRole.ASSISTANT, "rooms": ["Room 1 - Morning"], "campus_idx": 0},
        {"first_name": "Brittany", "last_name": "Kilcrease", "role": StaffRole.ADMIN, "rooms": [], "campus_idx": 1},
        {"first_name": "Pam", "last_name": "Riffle", "role": StaffRole.TEACHER, "rooms": ["Room 2 - Morning", "Room 2 - Afternoon"], "campus_idx": 0},
        {"first_name": "Sami", "last_name": "Flores", "role": StaffRole.TEACHER, "rooms": ["Room 3 - Morning", "Room 3 - Afternoon"], "campus_idx": 1},
        {"first_name": "Jewel", "last_name": "Brooks", "role": StaffRole.TEACHER, "rooms": ["Room 1 - Morning"], "campus_idx": 2},
        {"first_name": "Crislynn", "last_name": "Giles", "role": StaffRole.TEACHER, "rooms": ["Room 4 - Afternoon"], "campus_idx": 2},
    ]
    
    for i, staff_info in enumerate(staff_data):
        campus_ids = [c.campus_id for c in campuses_db] if staff_info["campus_idx"] is None else [campuses_db[staff_info["campus_idx"]].campus_id]
        
        staff = Staff(
            staff_id=f"staff_{i+1}",
            campus_ids=campus_ids,
            first_name=staff_info["first_name"],
            last_name=staff_info["last_name"],
            role=staff_info["role"],
            email=f"{staff_info['first_name'].lower()}.{staff_info['last_name'].lower()}@epicprepacademy.com",
            assigned_rooms=staff_info["rooms"],
            permissions="Admin" if staff_info["role"] in [StaffRole.OWNER, StaffRole.ADMIN] else "Teacher"
        )
        staff_db.append(staff)
    
    num_families = random.randint(18, 22)
    student_counter = 1
    parent_counter = 1
    
    for fam_idx in range(num_families):
        family_id = f"family_{fam_idx + 1}"
        family_last_name = random.choice(last_names)
        family_campus = random.choice(campuses_db)
        
        num_children = random.choices([1, 2, 3], weights=[0.4, 0.45, 0.15])[0]
        
        num_parents = random.choice([1, 2])
        family_parent_ids = []
        family_parents = []
        
        for p_idx in range(num_parents):
            parent_id = f"parent_{parent_counter}"
            parent_counter += 1
            
            parent = Parent(
                parent_id=parent_id,
                first_name=random.choice(first_names),
                last_name=family_last_name,
                email=f"{parent_id}@email.com",
                phone=f"850-{random.randint(100,999)}-{random.randint(1000,9999)}",
                relationship=["Mother", "Father", "Guardian"][p_idx % 3],
                primary_guardian=(p_idx == 0),
                preferred_contact_method=random.choice(["Text", "Email", "App"]),
                student_ids=[]
            )
            family_parent_ids.append(parent_id)
            family_parents.append(parent)
        
        billing_status_choice = random.choices(
            [BillingStatus.GREEN, BillingStatus.YELLOW, BillingStatus.RED],
            weights=[0.6, 0.15, 0.25]
        )[0]
        
        if billing_status_choice == BillingStatus.GREEN:
            current_balance = random.uniform(0, 50)
        elif billing_status_choice == BillingStatus.YELLOW:
            current_balance = random.uniform(50, 200)
        else:
            current_balance = random.uniform(200, 800)
        
        monthly_tuition = num_children * random.uniform(400, 600)
        
        family_student_ids = []
        
        for child_idx in range(num_children):
            student_id = f"student_{student_counter}"
            student_counter += 1
            
            if child_idx == 0:
                grade = random.choice(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"])
            elif child_idx == 1:
                grade = random.choice(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
            else:
                grade = random.choice(["K", "1", "2", "3", "4", "5", "6"])
            
            if grade in ["K", "1", "2", "3", "4", "5", "6", "7"]:
                session = Session.MORNING
            else:
                session = Session.AFTERNOON
            
            if grade in ["K", "1", "2"]:
                room = Room.ROOM_1
            elif grade in ["3", "4", "5", "8", "9"]:
                room = Room.ROOM_2
            elif grade in ["6", "7", "10", "11"]:
                room = Room.ROOM_3
            else:
                room = Room.ROOM_4
            
            attendance_present = random.randint(15, 20)
            attendance_absent = random.randint(0, 5)
            attendance_tardy = random.randint(0, 3)
            
            grade_flag_choice = random.choices(
                [GradeFlag.ON_TRACK, GradeFlag.NEEDS_ATTENTION, GradeFlag.FAILING],
                weights=[0.7, 0.2, 0.1]
            )[0]
            
            ixl_status = random.choices(
                [IXLStatus.ON_TRACK, IXLStatus.NEEDS_ATTENTION],
                weights=[0.75, 0.25]
            )[0]
            
            if grade_flag_choice == GradeFlag.FAILING or attendance_absent > 3 or ixl_status == IXLStatus.NEEDS_ATTENTION:
                risk_flag = random.choices(
                    [RiskFlag.NONE, RiskFlag.WATCH, RiskFlag.AT_RISK],
                    weights=[0.3, 0.4, 0.3]
                )[0]
            else:
                risk_flag = RiskFlag.NONE
            
            if grade == "K":
                birth_year = 2019
            else:
                birth_year = 2024 - int(grade) - 5
            
            step_up_pct = random.choice([0, 50, 100])
            if step_up_pct == 0:
                funding_source = FundingSource.OUT_OF_POCKET
            elif step_up_pct == 100:
                funding_source = FundingSource.STEP_UP
            else:
                funding_source = FundingSource.MIXED
            
            student = Student(
                student_id=student_id,
                campus_id=family_campus.campus_id,
                first_name=random.choice(first_names),
                last_name=family_last_name,
                date_of_birth=date(birth_year, random.randint(1, 12), random.randint(1, 28)),
                grade=grade,
                session=session,
                room=room,
                status=StudentStatus.ACTIVE,
                family_id=family_id,
                enrollment_start_date=date(2024, 8, 15),
                enrollment_end_date=None,
                attendance_present_count=attendance_present,
                attendance_absent_count=attendance_absent,
                attendance_tardy_count=attendance_tardy,
                overall_grade_flag=grade_flag_choice,
                ixl_status_flag=ixl_status,
                overall_risk_flag=risk_flag,
                funding_source=funding_source,
                step_up_percentage=step_up_pct
            )
            
            family_student_ids.append(student_id)
            students_db.append(student)
            
            subjects = ["Math", "ELA", "Science", "Social Studies"]
            for subject in subjects:
                grade_value = random.choices(
                    ["A", "B", "C", "D", "F"],
                    weights=[0.3, 0.35, 0.2, 0.1, 0.05]
                )[0]
                
                grade_record = GradeRecord(
                    grade_record_id=f"grade_{len(grade_records_db) + 1}",
                    campus_id=family_campus.campus_id,
                    student_id=student_id,
                    subject=subject,
                    term="Current Term",
                    grade_value=grade_value,
                    is_failing=(grade_value in ["D", "F"])
                )
                grade_records_db.append(grade_record)
            
            num_notes = random.randint(1, 3)
            for note_idx in range(num_notes):
                note_type = random.choices(
                    [BehaviorType.POSITIVE, BehaviorType.CONCERN],
                    weights=[0.75, 0.25]
                )[0]
                
                if note_type == BehaviorType.POSITIVE:
                    summaries = [
                        "Great participation in class discussion",
                        "Helped another student with assignment",
                        "Excellent work on project presentation",
                        "Showed leadership during group activity"
                    ]
                else:
                    summaries = [
                        "Talking during quiet work time",
                        "Incomplete homework assignment",
                        "Needs reminder to stay on task",
                        "Difficulty following directions"
                    ]
                
                behavior_note = BehaviorNote(
                    behavior_note_id=f"behavior_{len(behavior_notes_db) + 1}",
                    campus_id=family_campus.campus_id,
                    student_id=student_id,
                    date=date.today() - timedelta(days=random.randint(1, 30)),
                    type=note_type,
                    summary=random.choice(summaries),
                    flag_for_followup=(note_type == BehaviorType.CONCERN and random.random() < 0.3)
                )
                behavior_notes_db.append(behavior_note)
            
            for day_offset in range(20):
                att_date = date.today() - timedelta(days=day_offset)
                if att_date.weekday() < 5:  # Monday-Friday
                    att_status = random.choices(
                        [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.TARDY],
                        weights=[0.85, 0.10, 0.05]
                    )[0]
                    
                    attendance_record = AttendanceRecord(
                        attendance_id=f"attendance_{len(attendance_records_db) + 1}",
                        campus_id=family_campus.campus_id,
                        student_id=student_id,
                        date=att_date,
                        status=att_status,
                        session=session
                    )
                    attendance_records_db.append(attendance_record)
            
            math_prof = random.choices(
                [IXLStatus.ON_TRACK, IXLStatus.NEEDS_ATTENTION],
                weights=[0.75, 0.25]
            )[0]
            ela_prof = random.choices(
                [IXLStatus.ON_TRACK, IXLStatus.NEEDS_ATTENTION],
                weights=[0.75, 0.25]
            )[0]
            
            ixl_skills = [
                "Multiplying fractions", "Main idea in nonfiction", "Dividing decimals",
                "Context clues", "Solving equations", "Author's purpose", "Geometry basics",
                "Vocabulary in context", "Ratios and proportions", "Literary devices"
            ]
            
            ixl_summary = IXLSummary(
                ixl_summary_id=f"ixl_{student_id}",
                campus_id=family_campus.campus_id,
                student_id=student_id,
                week_start_date=date.today() - timedelta(days=date.today().weekday()),
                weekly_hours=round(random.uniform(0.0, 5.0), 1),
                skills_practiced_this_week=random.randint(5, 20),
                skills_mastered_total=random.randint(20, 150),
                math_proficiency=math_prof,
                ela_proficiency=ela_prof,
                last_active_date=date.today() - timedelta(days=random.randint(0, 14)),
                recent_skills=random.sample(ixl_skills, 3)
            )
            ixl_summaries_db.append(ixl_summary)
        
        for parent in family_parents:
            parent.student_ids = family_student_ids
            parents_db.append(parent)
        
        family = Family(
            family_id=family_id,
            family_name=f"{family_last_name} Family",
            primary_parent_id=family_parent_ids[0],
            parent_ids=family_parent_ids,
            student_ids=family_student_ids,
            monthly_tuition_amount=round(monthly_tuition, 2),
            current_balance=round(current_balance, 2),
            billing_status=billing_status_choice,
            last_payment_date=date.today() - timedelta(days=random.randint(5, 45)),
            last_payment_amount=round(monthly_tuition, 2)
        )
        families_db.append(family)
        
        for month_offset in range(6):
            charge_date = date.today() - timedelta(days=30 * month_offset)
            period_month = charge_date.strftime('%Y-%m')
            
            for student_id in family_student_ids:
                student = next(s for s in students_db if s.student_id == student_id)
                student_tuition = monthly_tuition / len(family_student_ids)
                
                billing_record = BillingRecord(
                    billing_record_id=f"billing_{len(billing_records_db) + 1}",
                    campus_id=family_campus.campus_id,
                    family_id=family_id,
                    date=charge_date,
                    type="Charge",
                    description=f"{charge_date.strftime('%B')} Tuition - {student.first_name}",
                    amount=round(student_tuition, 2),
                    source=None,
                    period_month=period_month,
                    category=BillingCategory.TUITION,
                    student_id=student_id
                )
                billing_records_db.append(billing_record)
                
                if billing_status_choice != BillingStatus.RED or month_offset > 0:
                    payment_date = charge_date + timedelta(days=random.randint(1, 10))
                    
                    step_up_amount = round(student_tuition * (student.step_up_percentage / 100), 2)
                    out_of_pocket_amount = round(student_tuition - step_up_amount, 2)
                    
                    if step_up_amount > 0:
                        step_up_payment = BillingRecord(
                            billing_record_id=f"billing_{len(billing_records_db) + 1}",
                            campus_id=family_campus.campus_id,
                            family_id=family_id,
                            date=payment_date,
                            type="Payment",
                            description=f"Step-Up Payment - {student.first_name}",
                            amount=-step_up_amount,
                            source=PaymentSource.STEP_UP,
                            period_month=period_month,
                            category=BillingCategory.TUITION,
                            student_id=student_id
                        )
                        billing_records_db.append(step_up_payment)
                    
                    if out_of_pocket_amount > 0:
                        out_of_pocket_payment = BillingRecord(
                            billing_record_id=f"billing_{len(billing_records_db) + 1}",
                            campus_id=family_campus.campus_id,
                            family_id=family_id,
                            date=payment_date,
                            type="Payment",
                            description=f"Card Payment - {student.first_name}",
                            amount=-out_of_pocket_amount,
                            source=PaymentSource.OUT_OF_POCKET,
                            period_month=period_month,
                            category=BillingCategory.TUITION,
                            student_id=student_id
                        )
                        billing_records_db.append(out_of_pocket_payment)
    
    for i in range(10):
        student = random.choice(students_db)
        family = next(f for f in families_db if f.family_id == student.family_id)
        teacher = random.choice([s for s in staff_db if s.role == StaffRole.TEACHER])
        
        conf_status = random.choice([ConferenceStatus.SCHEDULED, ConferenceStatus.COMPLETED])
        conf_date = datetime.now() + timedelta(days=random.randint(-30, 30))
        
        conference = Conference(
            conference_id=f"conf_{i + 1}",
            campus_id=student.campus_id,
            student_id=student.student_id,
            parent_id=family.primary_parent_id,
            staff_id=teacher.staff_id,
            date_time=conf_date,
            location=random.choice(["In-person", "Zoom", "Phone"]),
            status=conf_status,
            notes="Discussed progress and goals" if conf_status == ConferenceStatus.COMPLETED else None
        )
        conferences_db.append(conference)
    
    for i in range(15):
        student = random.choice(students_db)
        family = next(f for f in families_db if f.family_id == student.family_id)
        teacher = random.choice([s for s in staff_db if s.role == StaffRole.TEACHER])
        
        is_parent_sender = random.choice([True, False])
        
        if is_parent_sender:
            message_contents = [
                f"{student.first_name} will be absent tomorrow",
                "Question about homework assignment",
                "Thank you for the update on progress",
                "Can we schedule a conference?"
            ]
        else:
            message_contents = [
                f"{student.first_name} had a great day today!",
                "Reminder: Field trip permission slip due Friday",
                f"{student.first_name} needs to complete missing assignment",
                "Progress report available in portal"
            ]
        
        message = Message(
            message_id=f"msg_{i + 1}",
            campus_id=student.campus_id,
            sender_type=MessageSenderType.PARENT if is_parent_sender else MessageSenderType.STAFF,
            sender_id=family.primary_parent_id if is_parent_sender else teacher.staff_id,
            recipient_type=MessageSenderType.STAFF if is_parent_sender else MessageSenderType.PARENT,
            recipient_id=teacher.staff_id if is_parent_sender else family.primary_parent_id,
            student_id=student.student_id,
            date_time=datetime.now() - timedelta(days=random.randint(0, 14)),
            content_preview=random.choice(message_contents)
        )
        messages_db.append(message)
    
    events_db = []
    event_rsvps_db = []
    
    event_titles = [
        ("Fall Festival", EventType.SCHOOL_EVENT, "Join us for our annual fall festival with games, food, and fun!"),
        ("Science Fair", EventType.SCHOOL_EVENT, "Students will present their science projects to families and judges."),
        ("Field Trip to Museum", EventType.FIELD_TRIP, "Visit the Natural History Museum for a day of learning and exploration."),
        ("Spring Concert", EventType.PERFORMANCE, "Students will perform songs they've been practicing all semester."),
        ("Parent-Teacher Night", EventType.PARENT_NIGHT, "Meet with teachers to discuss your child's progress."),
        ("Book Fair Fundraiser", EventType.FUNDRAISER, "Support our library by purchasing books at our annual book fair."),
        ("Holiday Performance", EventType.PERFORMANCE, "Join us for a festive holiday show featuring all grade levels."),
        ("Field Trip to Zoo", EventType.FIELD_TRIP, "Explore the local zoo and learn about animal habitats.")
    ]
    
    for i, (title, event_type, description) in enumerate(event_titles):
        event_date = date.today() + timedelta(days=random.randint(-30, 60))
        requires_payment = event_type in [EventType.FIELD_TRIP, EventType.FUNDRAISER]
        event_campus = random.choice(campuses_db)
        
        event = Event(
            event_id=f"event_{i+1}",
            campus_id=event_campus.campus_id,
            title=title,
            description=description,
            event_type=event_type,
            date=event_date,
            time=random.choice(["9:00 AM", "10:00 AM", "2:00 PM", "6:00 PM"]),
            location=random.choice(["School Auditorium", "Gymnasium", "Cafeteria", "Off-site"]),
            requires_rsvp=True,
            requires_permission_slip=(event_type == EventType.FIELD_TRIP),
            requires_payment=requires_payment,
            payment_amount=random.choice([15.0, 25.0, 35.0]) if requires_payment else None,
            created_by_staff_id=random.choice([s.staff_id for s in staff_db if s.role in [StaffRole.ADMIN, StaffRole.OWNER]])
        )
        events_db.append(event)
        
        campus_families = [f for f in families_db if any(s.campus_id == event_campus.campus_id for s in students_db if s.family_id == f.family_id)]
        for family in random.sample(campus_families, min(random.randint(5, 12), len(campus_families))):
            rsvp = EventRSVP(
                rsvp_id=f"rsvp_{len(event_rsvps_db)+1}",
                campus_id=event_campus.campus_id,
                event_id=event.event_id,
                family_id=family.family_id,
                parent_id=family.primary_parent_id,
                student_ids=family.student_ids,
                status=random.choice([RSVPStatus.ATTENDING, RSVPStatus.NOT_ATTENDING, RSVPStatus.PENDING]),
                response_date=datetime.now() - timedelta(days=random.randint(0, 10)) if random.random() > 0.3 else None
            )
            event_rsvps_db.append(rsvp)
    
    documents_db = []
    document_signatures_db = []
    
    doc_templates = [
        ("2024-2025 Enrollment Contract", DocumentType.ENROLLMENT_CONTRACT, "Annual enrollment agreement for the school year", "All Students"),
        ("Emergency Contact Form", DocumentType.EMERGENCY_CONTACT, "Required emergency contact information", "All Students"),
        ("Medical Information Form", DocumentType.MEDICAL_FORM, "Student health and allergy information", "All Students"),
        ("Field Trip Permission - Museum", DocumentType.PERMISSION_SLIP, "Permission for Natural History Museum field trip", "Grade 3-5"),
        ("Field Trip Permission - Zoo", DocumentType.PERMISSION_SLIP, "Permission for zoo field trip", "Grade K-2"),
        ("Photo Release Form", DocumentType.POLICY_ACKNOWLEDGMENT, "Permission to use student photos in school materials", "All Students"),
        ("Technology Use Policy", DocumentType.POLICY_ACKNOWLEDGMENT, "Agreement to follow school technology policies", "Grade 6-12")
    ]
    
    for i, (title, doc_type, description, required_for) in enumerate(doc_templates):
        doc_campus = random.choice(campuses_db)
        document = Document(
            document_id=f"doc_{i+1}",
            campus_id=doc_campus.campus_id,
            title=title,
            document_type=doc_type,
            description=description,
            required_for=required_for,
            status=DocumentStatus.PENDING,
            created_date=date.today() - timedelta(days=random.randint(30, 90)),
            expiration_date=date.today() + timedelta(days=365) if doc_type in [DocumentType.ENROLLMENT_CONTRACT, DocumentType.MEDICAL_FORM] else None,
            file_url=f"/documents/{title.lower().replace(' ', '_')}.pdf"
        )
        documents_db.append(document)
        
        campus_families = [f for f in families_db if any(s.campus_id == doc_campus.campus_id for s in students_db if s.family_id == f.family_id)]
        for family in random.sample(campus_families, min(random.randint(8, 15), len(campus_families))):
            if random.random() > 0.3:
                signature = DocumentSignature(
                    signature_id=f"sig_{len(document_signatures_db)+1}",
                    campus_id=doc_campus.campus_id,
                    document_id=document.document_id,
                    parent_id=family.primary_parent_id,
                    student_id=random.choice(family.student_ids) if family.student_ids else None,
                    signed_date=datetime.now() - timedelta(days=random.randint(1, 60)),
                    signature_data="Electronic Signature"
                )
                document_signatures_db.append(signature)
    
    products_db = []
    orders_db = []
    
    product_list = [
        ("School T-Shirt (Youth)", "Epic Prep Academy logo t-shirt in youth sizes", ProductCategory.APPAREL, 15.00),
        ("School T-Shirt (Adult)", "Epic Prep Academy logo t-shirt in adult sizes", ProductCategory.APPAREL, 20.00),
        ("School Hoodie", "Comfortable hoodie with school logo", ProductCategory.APPAREL, 35.00),
        ("Water Bottle", "Reusable water bottle with school branding", ProductCategory.SUPPLIES, 12.00),
        ("Backpack", "Durable backpack with Epic Prep logo", ProductCategory.SUPPLIES, 25.00),
        ("Yearbook 2024-2025", "Full-color yearbook with photos from the school year", ProductCategory.SUPPLIES, 30.00),
        ("Fall Festival Ticket", "Admission to Fall Festival event", ProductCategory.EVENT_FEE, 10.00),
        ("Field Trip Fee - Museum", "Transportation and admission to museum", ProductCategory.EVENT_FEE, 25.00)
    ]
    
    for i, (name, description, category, price) in enumerate(product_list):
        product = Product(
            product_id=f"prod_{i+1}",
            campus_id=None,
            name=name,
            description=description,
            category=category,
            price=price,
            image_url=f"/images/products/{name.lower().replace(' ', '_')}.jpg",
            available=True
        )
        products_db.append(product)
    
    for i in range(15):
        family = random.choice(families_db)
        family_students = [s for s in students_db if s.family_id == family.family_id]
        if not family_students:
            continue
        family_campus_id = family_students[0].campus_id
        num_items = random.randint(1, 3)
        items = []
        total = 0.0
        
        for _ in range(num_items):
            product = random.choice(products_db)
            quantity = random.randint(1, 2)
            items.append({
                "product_id": product.product_id,
                "product_name": product.name,
                "quantity": quantity,
                "price": product.price
            })
            total += product.price * quantity
        
        order = Order(
            order_id=f"order_{i+1}",
            campus_id=family_campus_id,
            family_id=family.family_id,
            parent_id=family.primary_parent_id,
            items=items,
            total_amount=round(total, 2),
            status=random.choice([OrderStatus.PAID, OrderStatus.PENDING]),
            order_date=datetime.now() - timedelta(days=random.randint(1, 30)),
            payment_date=datetime.now() - timedelta(days=random.randint(0, 5)) if random.random() > 0.3 else None
        )
        orders_db.append(order)
    
    photo_albums_db = []
    
    album_titles = [
        ("First Day of School 2024", "Photos from the exciting first day back!", ["All"]),
        ("Fall Festival Fun", "Highlights from our annual fall festival", ["All"]),
        ("Science Fair Projects", "Amazing student science projects", ["3", "4", "5"]),
        ("Holiday Concert", "Our wonderful holiday performance", ["All"]),
        ("Field Trip to Museum", "Learning and fun at the Natural History Museum", ["3", "4", "5"]),
        ("Kindergarten Activities", "Daily activities in our K classroom", ["K"]),
        ("Art Class Creations", "Beautiful artwork from our students", ["All"])
    ]
    
    for i, (title, description, grades) in enumerate(album_titles):
        album_campus = random.choice(campuses_db)
        album = PhotoAlbum(
            album_id=f"album_{i+1}",
            campus_id=album_campus.campus_id,
            title=title,
            description=description,
            created_by_staff_id=random.choice([s.staff_id for s in staff_db if s.role == StaffRole.TEACHER]),
            created_date=date.today() - timedelta(days=random.randint(1, 60)),
            status=random.choice([PhotoAlbumStatus.PUBLISHED, PhotoAlbumStatus.DRAFT]),
            photo_urls=[f"/photos/album_{i+1}/photo_{j+1}.jpg" for j in range(random.randint(5, 15))],
            visible_to_grades=grades
        )
        photo_albums_db.append(album)
    
    incidents_db = []
    
    incident_descriptions = [
        (IncidentType.BEHAVIORAL, IncidentSeverity.LOW, "Student was talking during quiet work time", "Verbal reminder given"),
        (IncidentType.BEHAVIORAL, IncidentSeverity.MEDIUM, "Student refused to follow directions", "Parent contacted, behavior plan discussed"),
        (IncidentType.MEDICAL, IncidentSeverity.LOW, "Student complained of headache", "Rested in nurse's office, parent notified"),
        (IncidentType.MEDICAL, IncidentSeverity.MEDIUM, "Student fell on playground, minor scrape", "First aid administered, parent notified"),
        (IncidentType.SAFETY, IncidentSeverity.MEDIUM, "Student left classroom without permission", "Safety discussion held, parent contacted"),
        (IncidentType.ACADEMIC, IncidentSeverity.LOW, "Student did not complete homework", "Reminder sent home"),
        (IncidentType.BEHAVIORAL, IncidentSeverity.HIGH, "Physical altercation with another student", "Both parents contacted, meeting scheduled")
    ]
    
    for i in range(12):
        student = random.choice(students_db)
        incident_type, severity, description, action = random.choice(incident_descriptions)
        
        incident = Incident(
            incident_id=f"incident_{i+1}",
            campus_id=student.campus_id,
            student_id=student.student_id,
            reported_by_staff_id=random.choice([s.staff_id for s in staff_db if s.role == StaffRole.TEACHER]),
            incident_type=incident_type,
            severity=severity,
            date=date.today() - timedelta(days=random.randint(1, 30)),
            time=random.choice(["9:30 AM", "11:00 AM", "1:30 PM", "3:00 PM"]),
            description=description,
            action_taken=action,
            parent_notified=(severity in [IncidentSeverity.MEDIUM, IncidentSeverity.HIGH]),
            followup_required=(severity == IncidentSeverity.HIGH)
        )
        incidents_db.append(incident)
    
    health_records_db = []
    
    common_allergies = ["None", "Peanuts", "Tree nuts", "Dairy", "Eggs", "Shellfish", "Bee stings"]
    common_medications = ["None", "Albuterol inhaler", "EpiPen", "ADHD medication", "Allergy medication"]
    common_conditions = ["None", "Asthma", "ADHD", "Diabetes", "Seasonal allergies", "Food allergies"]
    
    for student in students_db:
        family = next(f for f in families_db if f.family_id == student.family_id)
        parent = next(p for p in parents_db if p.parent_id == family.primary_parent_id)
        
        health_record = HealthRecord(
            health_record_id=f"health_{student.student_id}",
            campus_id=student.campus_id,
            student_id=student.student_id,
            allergies=[random.choice(common_allergies)],
            medications=[random.choice(common_medications)],
            medical_conditions=[random.choice(common_conditions)],
            emergency_contact_name=parent.first_name + " " + parent.last_name,
            emergency_contact_phone=parent.phone,
            emergency_contact_relationship=parent.relationship,
            physician_name=f"Dr. {random.choice(['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'])}",
            physician_phone=f"850-{random.randint(100,999)}-{random.randint(1000,9999)}",
            last_updated=date.today() - timedelta(days=random.randint(30, 180))
        )
        health_records_db.append(health_record)
    
    return {
        "organizations": organizations_db,
        "campuses": campuses_db,
        "users": users_db,
        "audit_logs": audit_logs_db,
        "students": students_db,
        "families": families_db,
        "parents": parents_db,
        "staff": staff_db,
        "grade_records": grade_records_db,
        "behavior_notes": behavior_notes_db,
        "attendance_records": attendance_records_db,
        "ixl_summaries": ixl_summaries_db,
        "billing_records": billing_records_db,
        "conferences": conferences_db,
        "messages": messages_db,
        "events": events_db,
        "event_rsvps": event_rsvps_db,
        "documents": documents_db,
        "document_signatures": document_signatures_db,
        "products": products_db,
        "orders": orders_db,
        "photo_albums": photo_albums_db,
        "incidents": incidents_db,
        "health_records": health_records_db
    }
