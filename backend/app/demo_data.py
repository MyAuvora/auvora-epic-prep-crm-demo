from datetime import date, datetime, timedelta
import random
from typing import List
from .main import (
    Organization, Campus, User, AuditLog,
    Student, Family, Parent, Staff, GradeRecord, BehaviorNote,
    AttendanceRecord, IXLSummary, BillingRecord, Conference, Message,
    Event, EventRSVP, Document, DocumentSignature, Product, Order,
    PhotoAlbum, Incident, HealthRecord,
    Invoice, InvoiceLineItem, PaymentPlan, PaymentSchedule,
    Lead, CampusCapacity, MessageTemplate, BroadcastMessage, AutomatedAlert,
    AcademicStandard, StandardAssessment, ProgressReport,
    IEP504Plan, Accommodation, IEPGoal,
    InterventionPlan, InterventionProgress,
    AtRiskAssessment, RetentionPrediction, EnrollmentForecast,
    Assignment, GradeEntry, Announcement, AnnouncementRead, EventWorkflow,
    Session, Room, StudentStatus, BillingStatus, AttendanceStatus,
    GradeFlag, IXLStatus, RiskFlag, StaffRole, BehaviorType,
    ConferenceStatus, MessageSenderType, EventType, RSVPStatus,
    DocumentType, DocumentStatus, ProductCategory, OrderStatus,
    PhotoAlbumStatus, IncidentType, IncidentSeverity,
    FundingSource, PaymentSource, BillingCategory,
    UserRole, AuditAction,
    InvoiceStatus, PaymentPlanStatus,
    LeadStage, LeadSource, CommunicationType, TriggerType, BroadcastStatus,
    MasteryLevel,
    PlanType, PlanStatus, AccommodationType, GoalStatus,
    RTITier, InterventionStatus,
    RiskCategory, RiskLevel,
    AssignmentType, AssignmentStatus, GradeEntryStatus,
    AnnouncementCategory, AnnouncementStatus, WorkflowStatus
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
    iep_504_plans_db = []
    accommodations_db = []
    iep_goals_db = []
    intervention_plans_db = []
    intervention_progress_db = []
    at_risk_assessments_db = []
    retention_predictions_db = []
    enrollment_forecasts_db = []
    
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
    
    invoices_db = []
    invoice_line_items_db = []
    payment_plans_db = []
    payment_schedules_db = []
    
    invoice_counter = 1
    
    for family in families_db:
        campus = next(c for c in campuses_db if any(s.campus_id == c.campus_id for s in students_db if s.family_id == family.family_id))
        family_students = [s for s in students_db if s.family_id == family.family_id]
        
        for month_offset in range(6):
            invoice_date = date.today().replace(day=1) - timedelta(days=30 * month_offset)
            due_date = invoice_date + timedelta(days=15)
            
            if month_offset == 0:
                if family.billing_status == BillingStatus.GREEN:
                    status = InvoiceStatus.PAID
                elif family.billing_status == BillingStatus.YELLOW:
                    status = InvoiceStatus.SENT
                else:
                    status = InvoiceStatus.OVERDUE
            elif month_offset <= 2:
                if family.billing_status == BillingStatus.GREEN:
                    status = InvoiceStatus.PAID
                elif family.billing_status == BillingStatus.RED:
                    status = random.choice([InvoiceStatus.OVERDUE, InvoiceStatus.SENT])
                else:
                    status = InvoiceStatus.PAID if random.random() > 0.3 else InvoiceStatus.SENT
            else:
                status = InvoiceStatus.PAID if random.random() > 0.1 else InvoiceStatus.OVERDUE
            
            invoice_id = f"inv_{invoice_counter}"
            invoice_number = f"INV-{invoice_date.year}-{invoice_date.month:02d}-{invoice_counter:04d}"
            
            subtotal = 0.0
            line_items = []
            
            for student in family_students:
                monthly_tuition = family.monthly_tuition_amount / len(family_students)
                
                payment_source = None
                if student.funding_source == FundingSource.STEP_UP:
                    payment_source = PaymentSource.STEP_UP
                elif student.funding_source == FundingSource.OUT_OF_POCKET:
                    payment_source = PaymentSource.OUT_OF_POCKET
                elif student.funding_source == FundingSource.MIXED:
                    payment_source = None
                
                line_item = InvoiceLineItem(
                    line_item_id=f"line_{invoice_counter}_{student.student_id}",
                    invoice_id=invoice_id,
                    description=f"Monthly Tuition - {student.first_name} {student.last_name}",
                    category=BillingCategory.TUITION,
                    student_id=student.student_id,
                    quantity=1,
                    unit_price=monthly_tuition,
                    total=monthly_tuition,
                    funding_source=payment_source
                )
                line_items.append(line_item)
                subtotal += monthly_tuition
            
            if random.random() < 0.2:
                fee_amount = random.choice([25.0, 50.0, 75.0])
                fee_description = random.choice(["Late Fee", "Materials Fee", "Field Trip Fee"])
                line_item = InvoiceLineItem(
                    line_item_id=f"line_{invoice_counter}_fee",
                    invoice_id=invoice_id,
                    description=fee_description,
                    category=BillingCategory.FEE,
                    student_id=None,
                    quantity=1,
                    unit_price=fee_amount,
                    total=fee_amount,
                    funding_source=None
                )
                line_items.append(line_item)
                subtotal += fee_amount
            
            tax = 0.0  # No tax on tuition in FL
            total = subtotal + tax
            
            if status == InvoiceStatus.PAID:
                amount_paid = total
                balance = 0.0
            elif status == InvoiceStatus.OVERDUE:
                amount_paid = random.uniform(0, total * 0.5)
                balance = total - amount_paid
            elif status == InvoiceStatus.SENT:
                amount_paid = random.uniform(0, total * 0.3) if random.random() < 0.3 else 0.0
                balance = total - amount_paid
            else:
                amount_paid = 0.0
                balance = total
            
            invoice = Invoice(
                invoice_id=invoice_id,
                campus_id=campus.campus_id,
                family_id=family.family_id,
                invoice_number=invoice_number,
                invoice_date=invoice_date,
                due_date=due_date,
                status=status,
                subtotal=subtotal,
                tax=tax,
                total=total,
                amount_paid=amount_paid,
                balance=balance,
                notes=None,
                created_date=datetime.combine(invoice_date, datetime.min.time()),
                last_updated=datetime.now()
            )
            invoices_db.append(invoice)
            invoice_line_items_db.extend(line_items)
            invoice_counter += 1
    
    payment_plan_counter = 1
    for family in families_db:
        if family.billing_status == BillingStatus.RED and family.current_balance > 200:
            campus = next(c for c in campuses_db if any(s.campus_id == c.campus_id for s in students_db if s.family_id == family.family_id))
            
            plan_amount = family.current_balance
            num_installments = random.choice([3, 6, 12])
            installment_amount = plan_amount / num_installments
            
            start_date = date.today()
            end_date = start_date + timedelta(days=30 * num_installments)
            
            paid_installments = random.randint(0, min(2, num_installments))
            amount_paid = paid_installments * installment_amount
            balance = plan_amount - amount_paid
            
            if paid_installments == num_installments:
                status = PaymentPlanStatus.COMPLETED
            elif paid_installments > 0 and date.today() < end_date:
                status = PaymentPlanStatus.ACTIVE
            elif date.today() > end_date and balance > 0:
                status = PaymentPlanStatus.DEFAULTED
            else:
                status = PaymentPlanStatus.ACTIVE
            
            payment_plan = PaymentPlan(
                payment_plan_id=f"plan_{payment_plan_counter}",
                campus_id=campus.campus_id,
                family_id=family.family_id,
                plan_name=f"Payment Plan - {family.family_name}",
                total_amount=plan_amount,
                amount_paid=amount_paid,
                balance=balance,
                start_date=start_date,
                end_date=end_date,
                status=status,
                created_date=datetime.combine(start_date, datetime.min.time()),
                last_updated=datetime.now()
            )
            payment_plans_db.append(payment_plan)
            
            for i in range(num_installments):
                installment_due_date = start_date + timedelta(days=30 * i)
                paid = i < paid_installments
                
                schedule = PaymentSchedule(
                    schedule_id=f"schedule_{payment_plan_counter}_{i+1}",
                    payment_plan_id=payment_plan.payment_plan_id,
                    installment_number=i + 1,
                    due_date=installment_due_date,
                    amount=installment_amount,
                    paid=paid,
                    paid_date=installment_due_date if paid else None,
                    paid_amount=installment_amount if paid else 0.0
                )
                payment_schedules_db.append(schedule)
            
            payment_plan_counter += 1
    
    leads_db = []
    campus_capacity_db = []
    message_templates_db = []
    broadcast_messages_db = []
    automated_alerts_db = []
    academic_standards_db = []
    standard_assessments_db = []
    progress_reports_db = []
    
    today = date.today()
    
    lead_first_names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia"]
    lead_last_names = ["Anderson", "Martinez", "Taylor", "Thomas", "Moore", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Robinson", "Clark", "Rodriguez", "Lewis"]
    parent_first_names = ["Jennifer", "Michael", "Sarah", "David", "Jessica", "Christopher", "Ashley", "Matthew", "Amanda", "Joshua", "Melissa", "Daniel", "Stephanie", "Andrew", "Nicole"]
    
    for i in range(25):
        campus = random.choice(campuses_db)
        child_first = random.choice(lead_first_names)
        child_last = random.choice(lead_last_names)
        parent_first = random.choice(parent_first_names)
        parent_last = child_last
        
        stages = [LeadStage.NEW_INQUIRY, LeadStage.CONTACTED, LeadStage.TOUR_SCHEDULED, LeadStage.TOURED, LeadStage.APPLICATION_SUBMITTED, LeadStage.ACCEPTED, LeadStage.LOST]
        stage = random.choice(stages)
        
        created = today - timedelta(days=random.randint(1, 90))
        last_contact = created + timedelta(days=random.randint(1, 7)) if stage != LeadStage.NEW_INQUIRY else None
        tour_date_val = created + timedelta(days=random.randint(7, 21)) if stage in [LeadStage.TOUR_SCHEDULED, LeadStage.TOURED, LeadStage.APPLICATION_SUBMITTED, LeadStage.ACCEPTED] else None
        
        lead = Lead(
            lead_id=f"lead_{i+1}",
            campus_id=campus.campus_id,
            parent_first_name=parent_first,
            parent_last_name=parent_last,
            email=f"{parent_first.lower()}.{parent_last.lower()}@example.com",
            phone=f"850-555-{random.randint(1000, 9999)}",
            child_first_name=child_first,
            child_last_name=child_last,
            child_dob=date(2015 + random.randint(0, 7), random.randint(1, 12), random.randint(1, 28)),
            desired_grade=random.choice(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]),
            desired_start_date=date(2025, 8, 15),
            stage=stage,
            source=random.choice(list(LeadSource)),
            created_date=created,
            last_contact_date=last_contact,
            tour_date=tour_date_val,
            notes=f"Interested in {campus.name}. {random.choice(['Referred by current parent.', 'Found us on social media.', 'Attended open house.', 'Looking for small class sizes.', 'Needs flexible schedule.'])}",
            assigned_to=random.choice([s.staff_id for s in staff_db if s.role in [StaffRole.ADMIN, StaffRole.OWNER]])
        )
        leads_db.append(lead)
    
    for campus in campuses_db:
        grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
        for grade in grades:
            for session in [Session.MORNING, Session.AFTERNOON]:
                current_enrolled = len([s for s in students_db if s.campus_id == campus.campus_id and s.grade == grade and s.session == session])
                waitlisted = len([s for s in students_db if s.campus_id == campus.campus_id and s.grade == grade and s.session == session and s.status == StudentStatus.WAITLISTED])
                
                capacity = CampusCapacity(
                    campus_id=campus.campus_id,
                    grade=grade,
                    session=session,
                    total_capacity=random.randint(8, 15),
                    current_enrollment=current_enrolled,
                    waitlist_count=waitlisted
                )
                campus_capacity_db.append(capacity)
    
    template_data = [
        {"name": "Attendance Alert", "trigger": TriggerType.ATTENDANCE_ALERT, "type": CommunicationType.EMAIL, "subject": "Attendance Alert for {student_name}", "body": "Your child {student_name} has been absent {absence_count} times this month. Please contact us if you need assistance."},
        {"name": "Grade Alert", "trigger": TriggerType.GRADE_ALERT, "type": CommunicationType.EMAIL, "subject": "Grade Update for {student_name}", "body": "We wanted to inform you that {student_name} is currently showing {grade_status} in {subject}. Let's schedule a conference to discuss."},
        {"name": "Balance Alert", "trigger": TriggerType.BALANCE_ALERT, "type": CommunicationType.EMAIL, "subject": "Account Balance Reminder", "body": "Your account has an outstanding balance of ${balance}. Please contact our office to arrange payment."},
        {"name": "Behavior Alert", "trigger": TriggerType.BEHAVIOR_ALERT, "type": CommunicationType.SMS, "subject": "Behavior Notice", "body": "{student_name} had a behavior incident today. Please check your email for details."},
        {"name": "IXL Alert", "trigger": TriggerType.IXL_ALERT, "type": CommunicationType.APP_NOTIFICATION, "subject": "IXL Progress Update", "body": "{student_name} has not logged into IXL in {days} days. Please encourage daily practice."}
    ]
    
    for i, template_info in enumerate(template_data):
        template = MessageTemplate(
            template_id=f"template_{i+1}",
            name=template_info["name"],
            trigger_type=template_info["trigger"],
            communication_type=template_info["type"],
            subject=template_info["subject"],
            body=template_info["body"],
            active=True,
            created_date=date(2024, 1, 1)
        )
        message_templates_db.append(template)
    
    for i in range(12):
        campus = random.choice(campuses_db) if i % 3 == 0 else None
        sender = random.choice([s for s in staff_db if s.role in [StaffRole.ADMIN, StaffRole.OWNER]])
        
        recipient_types = ["All Parents", "Grade K", "Grade 1-3", "Grade 4-6", "Grade 7-9", "Grade 10-12", "Session Morning", "Session Afternoon"]
        recipient_type = random.choice(recipient_types)
        
        statuses = [BroadcastStatus.SENT, BroadcastStatus.SENT, BroadcastStatus.SENT, BroadcastStatus.SCHEDULED, BroadcastStatus.DRAFT]
        status = random.choice(statuses)
        
        subjects = [
            "Important: School Closure Tomorrow",
            "Reminder: Parent-Teacher Conferences Next Week",
            "New After-School Program Starting",
            "Field Trip Permission Slips Due Friday",
            "Holiday Schedule Update",
            "Welcome Back! New Semester Information",
            "Yearbook Orders Now Open",
            "Spring Break Camp Registration",
            "Standardized Testing Schedule",
            "End of Year Celebration Details"
        ]
        
        sent_date_val = datetime.now() - timedelta(days=random.randint(1, 30)) if status == BroadcastStatus.SENT else None
        scheduled_date_val = datetime.now() + timedelta(days=random.randint(1, 7)) if status == BroadcastStatus.SCHEDULED else None
        
        broadcast = BroadcastMessage(
            broadcast_id=f"broadcast_{i+1}",
            campus_id=campus.campus_id if campus else None,
            sender_id=sender.staff_id,
            communication_type=random.choice([CommunicationType.EMAIL, CommunicationType.SMS, CommunicationType.ALL]),
            subject=subjects[i % len(subjects)],
            body=f"Dear Epic Prep Families,\n\n{subjects[i % len(subjects)]}.\n\nPlease contact the office if you have any questions.\n\nThank you,\nEpic Prep Academy",
            recipient_type=recipient_type,
            recipient_count=random.randint(15, 50),
            status=status,
            scheduled_date=scheduled_date_val,
            sent_date=sent_date_val,
            created_date=today - timedelta(days=random.randint(1, 45))
        )
        broadcast_messages_db.append(broadcast)
    
    alert_counter = 0
    for student in students_db[:10]:
        family = next((f for f in families_db if f.family_id == student.family_id), None)
        if not family:
            continue
        
        if student.attendance_absent_count > 3:
            alert = AutomatedAlert(
                alert_id=f"alert_{alert_counter+1}",
                trigger_type=TriggerType.ATTENDANCE_ALERT,
                student_id=student.student_id,
                family_id=student.family_id,
                triggered_date=datetime.now() - timedelta(days=random.randint(1, 7)),
                message_sent=True,
                message_content=f"{student.first_name} has been absent {student.attendance_absent_count} times this month.",
                communication_type=CommunicationType.EMAIL
            )
            automated_alerts_db.append(alert)
            alert_counter += 1
        
        if student.overall_grade_flag == GradeFlag.FAILING:
            alert = AutomatedAlert(
                alert_id=f"alert_{alert_counter+1}",
                trigger_type=TriggerType.GRADE_ALERT,
                student_id=student.student_id,
                family_id=student.family_id,
                triggered_date=datetime.now() - timedelta(days=random.randint(1, 7)),
                message_sent=True,
                message_content=f"{student.first_name} is showing failing grades in one or more subjects.",
                communication_type=CommunicationType.EMAIL
            )
            automated_alerts_db.append(alert)
            alert_counter += 1
        
        if family.billing_status == BillingStatus.RED:
            alert = AutomatedAlert(
                alert_id=f"alert_{alert_counter+1}",
                trigger_type=TriggerType.BALANCE_ALERT,
                student_id=student.student_id,
                family_id=student.family_id,
                triggered_date=datetime.now() - timedelta(days=random.randint(1, 7)),
                message_sent=True,
                message_content=f"Outstanding balance of ${family.current_balance:.2f}.",
                communication_type=CommunicationType.EMAIL
            )
            automated_alerts_db.append(alert)
            alert_counter += 1
    
    standards_data = [
        {"subject": "Math", "grade": "K", "code": "CCSS.MATH.K.CC.A.1", "description": "Count to 100 by ones and tens", "category": "Counting & Cardinality"},
        {"subject": "Math", "grade": "1", "code": "CCSS.MATH.1.OA.A.1", "description": "Add and subtract within 20", "category": "Operations & Algebraic Thinking"},
        {"subject": "Math", "grade": "2", "code": "CCSS.MATH.2.NBT.A.1", "description": "Understand place value", "category": "Number & Operations in Base Ten"},
        {"subject": "Math", "grade": "3", "code": "CCSS.MATH.3.OA.A.1", "description": "Multiply and divide within 100", "category": "Operations & Algebraic Thinking"},
        {"subject": "Math", "grade": "4", "code": "CCSS.MATH.4.NF.A.1", "description": "Understand fraction equivalence", "category": "Number & Operations - Fractions"},
        {"subject": "Math", "grade": "5", "code": "CCSS.MATH.5.NBT.A.1", "description": "Understand the place value system", "category": "Number & Operations in Base Ten"},
        {"subject": "ELA", "grade": "K", "code": "CCSS.ELA.RF.K.1", "description": "Demonstrate understanding of print concepts", "category": "Reading Foundational Skills"},
        {"subject": "ELA", "grade": "1", "code": "CCSS.ELA.RF.1.3", "description": "Know and apply phonics and word analysis", "category": "Reading Foundational Skills"},
        {"subject": "ELA", "grade": "2", "code": "CCSS.ELA.RL.2.1", "description": "Ask and answer questions about key details", "category": "Reading Literature"},
        {"subject": "ELA", "grade": "3", "code": "CCSS.ELA.RL.3.2", "description": "Recount stories and determine central message", "category": "Reading Literature"},
        {"subject": "ELA", "grade": "4", "code": "CCSS.ELA.W.4.1", "description": "Write opinion pieces on topics", "category": "Writing"},
        {"subject": "ELA", "grade": "5", "code": "CCSS.ELA.W.5.2", "description": "Write informative/explanatory texts", "category": "Writing"},
        {"subject": "Science", "grade": "K", "code": "NGSS.K-PS2-1", "description": "Plan and conduct investigation of pushes and pulls", "category": "Physical Science"},
        {"subject": "Science", "grade": "1", "code": "NGSS.1-LS1-1", "description": "Use materials to design solutions for young plants and animals", "category": "Life Science"},
        {"subject": "Science", "grade": "2", "code": "NGSS.2-PS1-1", "description": "Plan and conduct investigation of different materials", "category": "Physical Science"},
        {"subject": "Science", "grade": "3", "code": "NGSS.3-LS1-1", "description": "Develop models to describe organisms' life cycles", "category": "Life Science"},
        {"subject": "Science", "grade": "4", "code": "NGSS.4-PS3-1", "description": "Use evidence to construct explanation of energy transfer", "category": "Physical Science"},
        {"subject": "Science", "grade": "5", "code": "NGSS.5-ESS2-1", "description": "Develop model using example to describe water cycle", "category": "Earth Science"}
    ]
    
    for i, std_data in enumerate(standards_data):
        standard = AcademicStandard(
            standard_id=f"standard_{i+1}",
            subject=std_data["subject"],
            grade=std_data["grade"],
            code=std_data["code"],
            description=std_data["description"],
            category=std_data["category"]
        )
        academic_standards_db.append(standard)
    
    assessment_counter = 0
    for student in students_db:
        relevant_standards = [s for s in academic_standards_db if s.grade == student.grade]
        
        if len(relevant_standards) == 0:
            continue
        
        num_assessments = random.randint(1, min(8, len(relevant_standards)))
        assessed_standards = random.sample(relevant_standards, num_assessments)
        
        teacher = random.choice([s for s in staff_db if s.role == StaffRole.TEACHER])
        
        for standard in assessed_standards:
            mastery_weights = [MasteryLevel.PROFICIENT, MasteryLevel.PROFICIENT, MasteryLevel.DEVELOPING, MasteryLevel.ADVANCED, MasteryLevel.BEGINNING]
            mastery = random.choice(mastery_weights)
            
            assessment = StandardAssessment(
                assessment_id=f"assessment_{assessment_counter+1}",
                student_id=student.student_id,
                standard_id=standard.standard_id,
                mastery_level=mastery,
                assessment_date=today - timedelta(days=random.randint(1, 60)),
                notes=random.choice(["Excellent progress", "Needs more practice", "Shows understanding", "Requires intervention", "Mastered concept", ""]),
                teacher_id=teacher.staff_id
            )
            standard_assessments_db.append(assessment)
            assessment_counter += 1
    
    for student in students_db:
        student_assessments = [a for a in standard_assessments_db if a.student_id == student.student_id]
        
        if len(student_assessments) > 0:
            proficient_count = len([a for a in student_assessments if a.mastery_level in [MasteryLevel.PROFICIENT, MasteryLevel.ADVANCED]])
            developing_count = len([a for a in student_assessments if a.mastery_level == MasteryLevel.DEVELOPING])
            beginning_count = len([a for a in student_assessments if a.mastery_level == MasteryLevel.BEGINNING])
            
            proficiency_rate = proficient_count / len(student_assessments) if len(student_assessments) > 0 else 0
            
            if proficiency_rate >= 0.8:
                overall = "Excelling"
            elif proficiency_rate >= 0.6:
                overall = "On Track"
            else:
                overall = "Needs Support"
            
            report = ProgressReport(
                report_id=f"report_{student.student_id}",
                student_id=student.student_id,
                term="Fall 2024",
                generated_date=today,
                standards_assessed=len(student_assessments),
                proficient_count=proficient_count,
                developing_count=developing_count,
                beginning_count=beginning_count,
                overall_progress=overall
            )
            progress_reports_db.append(report)
    
    iep_504_students = random.sample([s for s in students_db if s.grade in ["K", "1", "2", "3", "4", "5"]], min(5, len(students_db)))
    
    for idx, student in enumerate(iep_504_students):
        plan_type = random.choice([PlanType.IEP, PlanType.SECTION_504])
        case_manager = random.choice([s for s in staff_db if s.role == StaffRole.TEACHER])
        
        start_date = today - timedelta(days=random.randint(180, 730))
        end_date = start_date + timedelta(days=365)
        meeting_date = start_date - timedelta(days=random.randint(7, 30))
        next_review_date = start_date + timedelta(days=180)
        
        plan = IEP504Plan(
            plan_id=f"plan_{idx+1}",
            student_id=student.student_id,
            campus_id=student.campus_id,
            plan_type=plan_type,
            status=PlanStatus.ACTIVE,
            start_date=start_date,
            end_date=end_date,
            case_manager=case_manager.staff_id,
            disability_category=random.choice(["Specific Learning Disability", "Speech/Language Impairment", "ADHD", "Autism Spectrum", "Other Health Impairment"]) if plan_type == PlanType.IEP else None,
            meeting_date=meeting_date,
            next_review_date=next_review_date,
            parent_consent_date=meeting_date + timedelta(days=random.randint(1, 5)),
            notes=f"Student requires specialized support in academic and/or behavioral areas."
        )
        iep_504_plans_db.append(plan)
        
        accommodation_types = [
            (AccommodationType.INSTRUCTIONAL, "Extended time on tests and assignments", "Daily", "All teachers"),
            (AccommodationType.ENVIRONMENTAL, "Preferential seating near teacher", "Daily", case_manager.staff_id),
            (AccommodationType.ASSESSMENT, "Tests read aloud", "During assessments", case_manager.staff_id),
            (AccommodationType.BEHAVIORAL, "Frequent breaks as needed", "As needed", case_manager.staff_id),
        ]
        
        num_accommodations = random.randint(2, 4)
        for acc_idx, (acc_type, desc, freq, staff) in enumerate(random.sample(accommodation_types, num_accommodations)):
            accommodation = Accommodation(
                accommodation_id=f"acc_{idx+1}_{acc_idx+1}",
                plan_id=plan.plan_id,
                type=acc_type,
                description=desc,
                frequency=freq,
                responsible_staff=staff,
                implementation_notes="Implemented consistently across all settings."
            )
            accommodations_db.append(accommodation)
        
        if plan_type == PlanType.IEP:
            goal_areas = [
                ("Reading", "Improve reading fluency", "40 words per minute", "80 words per minute"),
                ("Math", "Master multiplication facts", "50% accuracy", "90% accuracy"),
                ("Behavior", "Reduce disruptive behaviors", "5 incidents per week", "1 incident per week"),
                ("Social Skills", "Initiate peer interactions", "1 interaction per day", "5 interactions per day"),
            ]
            
            num_goals = random.randint(2, 3)
            for goal_idx, (area, desc, baseline, target) in enumerate(random.sample(goal_areas, num_goals)):
                goal = IEPGoal(
                    goal_id=f"goal_{idx+1}_{goal_idx+1}",
                    plan_id=plan.plan_id,
                    area=area,
                    goal_description=desc,
                    baseline=baseline,
                    target=target,
                    target_date=end_date - timedelta(days=30),
                    status=random.choice([GoalStatus.IN_PROGRESS, GoalStatus.IN_PROGRESS, GoalStatus.ACHIEVED]),
                    progress_percentage=random.randint(40, 95),
                    last_updated=today - timedelta(days=random.randint(1, 30))
                )
                iep_goals_db.append(goal)
    
    intervention_students = random.sample([s for s in students_db if s not in iep_504_students], min(8, len(students_db) - len(iep_504_students)))
    
    for idx, student in enumerate(intervention_students):
        tier = random.choice([RTITier.TIER_2, RTITier.TIER_2, RTITier.TIER_3])
        area = random.choice(["Reading", "Math", "Behavior", "Attendance"])
        
        strategies = {
            "Reading": ["Small group phonics instruction", "Guided reading sessions", "Reading fluency practice"],
            "Math": ["Math fact fluency drills", "Concrete manipulatives", "One-on-one tutoring"],
            "Behavior": ["Check-in/Check-out system", "Social skills group", "Behavior contract"],
            "Attendance": ["Daily attendance monitoring", "Parent communication plan", "Incentive system"]
        }
        
        start_date = today - timedelta(days=random.randint(30, 90))
        staff_member = random.choice([s for s in staff_db if s.role == StaffRole.TEACHER])
        
        intervention = InterventionPlan(
            intervention_id=f"intervention_{idx+1}",
            student_id=student.student_id,
            campus_id=student.campus_id,
            tier=tier,
            area_of_concern=area,
            intervention_strategy=random.choice(strategies[area]),
            start_date=start_date,
            end_date=None if random.random() > 0.3 else start_date + timedelta(days=random.randint(60, 120)),
            frequency="Daily" if tier == RTITier.TIER_3 else random.choice(["Daily", "3x per week", "Weekly"]),
            duration_minutes=30 if tier == RTITier.TIER_3 else 20,
            staff_responsible=staff_member.staff_id,
            status=InterventionStatus.ACTIVE if random.random() > 0.2 else InterventionStatus.COMPLETED,
            baseline_data=f"Baseline: {random.randint(20, 50)}%",
            target_goal=f"Target: {random.randint(70, 90)}%"
        )
        intervention_plans_db.append(intervention)
        
        num_progress_points = random.randint(3, 8)
        for prog_idx in range(num_progress_points):
            progress_date = start_date + timedelta(days=(prog_idx + 1) * 7)
            if progress_date > today:
                break
            
            progress = InterventionProgress(
                progress_id=f"progress_{idx+1}_{prog_idx+1}",
                intervention_id=intervention.intervention_id,
                date=progress_date,
                data_point=random.uniform(30.0, 85.0),
                notes=random.choice(["Showing improvement", "Steady progress", "Needs more support", "Excellent growth", "Maintaining gains"]),
                staff_id=staff_member.staff_id
            )
            intervention_progress_db.append(progress)
    
    at_risk_students = random.sample(students_db, min(12, len(students_db)))
    
    for idx, student in enumerate(at_risk_students):
        attendance_rate = student.attendance_present_count / max(1, student.attendance_present_count + student.attendance_absent_count)
        attendance_score = int(attendance_rate * 100)
        
        student_grades = [g for g in grade_records_db if g.student_id == student.student_id]
        failing_count = len([g for g in student_grades if g.is_failing])
        academic_score = max(0, 100 - (failing_count * 25))
        
        student_behaviors = [b for b in behavior_notes_db if b.student_id == student.student_id]
        concern_count = len([b for b in student_behaviors if b.type == BehaviorType.CONCERN])
        behavior_score = max(0, 100 - (concern_count * 15))
        
        engagement_score = random.randint(50, 95)
        
        overall_score = int((academic_score * 0.35 + attendance_score * 0.25 + behavior_score * 0.25 + engagement_score * 0.15))
        
        if overall_score >= 75:
            risk_level = RiskLevel.LOW
        elif overall_score >= 60:
            risk_level = RiskLevel.MEDIUM
        elif overall_score >= 40:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.CRITICAL
        
        risk_factors = []
        if attendance_score < 85:
            risk_factors.append("Poor attendance")
        if academic_score < 70:
            risk_factors.append("Failing grades")
        if behavior_score < 70:
            risk_factors.append("Behavior concerns")
        if engagement_score < 60:
            risk_factors.append("Low engagement")
        
        recommended_interventions = []
        if "Poor attendance" in risk_factors:
            recommended_interventions.append("Attendance intervention plan")
        if "Failing grades" in risk_factors:
            recommended_interventions.append("Academic tutoring")
        if "Behavior concerns" in risk_factors:
            recommended_interventions.append("Behavior support plan")
        if "Low engagement" in risk_factors:
            recommended_interventions.append("Mentorship program")
        
        assessor = random.choice([s for s in staff_db if s.role in [StaffRole.TEACHER, StaffRole.ADMIN]])
        
        assessment = AtRiskAssessment(
            assessment_id=f"risk_assessment_{idx+1}",
            student_id=student.student_id,
            campus_id=student.campus_id,
            assessment_date=today - timedelta(days=random.randint(1, 30)),
            overall_risk_score=overall_score,
            overall_risk_level=risk_level,
            academic_score=academic_score,
            attendance_score=attendance_score,
            behavior_score=behavior_score,
            engagement_score=engagement_score,
            risk_factors=risk_factors if risk_factors else ["None identified"],
            recommended_interventions=recommended_interventions if recommended_interventions else ["Continue monitoring"],
            assessed_by=assessor.staff_id
        )
        at_risk_assessments_db.append(assessment)
    
    retention_students = random.sample(students_db, min(10, len(students_db)))
    
    for idx, student in enumerate(retention_students):
        student_assessment = next((a for a in at_risk_assessments_db if a.student_id == student.student_id), None)
        
        if student_assessment:
            base_probability = student_assessment.overall_risk_score / 100.0
        else:
            base_probability = random.uniform(0.6, 0.95)
        
        retention_prob = min(1.0, max(0.0, base_probability + random.uniform(-0.1, 0.1)))
        
        if retention_prob >= 0.8:
            risk_level = RiskLevel.LOW
        elif retention_prob >= 0.65:
            risk_level = RiskLevel.MEDIUM
        elif retention_prob >= 0.5:
            risk_level = RiskLevel.HIGH
        else:
            risk_level = RiskLevel.CRITICAL
        
        key_factors = []
        if retention_prob < 0.7:
            key_factors.extend(["Academic performance", "Attendance patterns", "Family engagement"])
        else:
            key_factors.extend(["Strong academic performance", "Good attendance", "Family support"])
        
        recommended_actions = []
        if retention_prob < 0.7:
            recommended_actions.extend(["Schedule parent conference", "Implement intervention plan", "Increase communication"])
        else:
            recommended_actions.extend(["Continue current support", "Monitor progress"])
        
        prediction = RetentionPrediction(
            prediction_id=f"retention_{idx+1}",
            student_id=student.student_id,
            campus_id=student.campus_id,
            school_year="2024-2025",
            retention_probability=retention_prob,
            risk_level=risk_level,
            key_factors=key_factors,
            recommended_actions=recommended_actions,
            last_updated=today - timedelta(days=random.randint(1, 14))
        )
        retention_predictions_db.append(prediction)
    
    for campus in campuses_db:
        grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
        
        for grade in grades:
            current_enrollment = len([s for s in students_db if s.campus_id == campus.campus_id and s.grade == grade])
            
            growth_factor = random.uniform(0.9, 1.15)
            forecasted = int(current_enrollment * growth_factor)
            
            confidence_low = int(forecasted * 0.85)
            confidence_high = int(forecasted * 1.15)
            
            factors = [
                "Historical enrollment trends",
                "Local demographic data",
                "Marketing initiatives",
                "Retention rates",
                "Waitlist size"
            ]
            
            forecast = EnrollmentForecast(
                forecast_id=f"forecast_{campus.campus_id}_{grade}",
                campus_id=campus.campus_id,
                school_year="2025-2026",
                grade_level=grade,
                forecasted_enrollment=forecasted,
                confidence_interval_low=confidence_low,
                confidence_interval_high=confidence_high,
                based_on_factors=random.sample(factors, 3),
                generated_date=today
            )
            enrollment_forecasts_db.append(forecast)
    
    assignments_db = []
    grade_entries_db = []
    announcements_db = []
    announcement_reads_db = []
    event_workflows_db = []
    
    for staff_member in staff_db:
        if staff_member.role == StaffRole.DIRECTOR:
            staff_member.role = StaffRole.DIRECTOR
        elif staff_member.role == StaffRole.MANAGER:
            staff_member.role = StaffRole.MANAGER
    
    director_count = sum(1 for s in staff_db if s.role == StaffRole.DIRECTOR)
    manager_count = sum(1 for s in staff_db if s.role == StaffRole.MANAGER)
    
    if director_count == 0:
        for i, campus in enumerate(campuses_db):
            director = Staff(
                staff_id=f"staff_director_{i+1}",
                campus_ids=[campus.campus_id],
                first_name=["Sarah", "Michael", "Jennifer"][i],
                last_name=["Thompson", "Rodriguez", "Chen"][i],
                role=StaffRole.DIRECTOR,
                email=f"director{i+1}@epicprepacademy.com",
                assigned_rooms=[],
                permissions="Admin"
            )
            staff_db.append(director)
    
    if manager_count == 0:
        for i, campus in enumerate(campuses_db):
            manager = Staff(
                staff_id=f"staff_manager_{i+1}",
                campus_ids=[campus.campus_id],
                first_name=["David", "Lisa", "Robert"][i],
                last_name=["Martinez", "Anderson", "Taylor"][i],
                role=StaffRole.MANAGER,
                email=f"manager{i+1}@epicprepacademy.com",
                assigned_rooms=[],
                permissions="Admin"
            )
            staff_db.append(manager)
    
    teachers = [s for s in staff_db if s.role == StaffRole.TEACHER]
    assignment_titles = {
        "Math": ["Fractions Quiz", "Multiplication Test", "Word Problems Homework", "Geometry Project", "Algebra Quiz"],
        "ELA": ["Book Report", "Grammar Quiz", "Creative Writing", "Reading Comprehension Test", "Vocabulary Homework"],
        "Science": ["Solar System Project", "Lab Report", "Science Fair Proposal", "Biology Quiz", "Chemistry Test"],
        "Social Studies": ["History Essay", "Geography Quiz", "Current Events Report", "Map Project", "Civics Test"]
    }
    
    assignment_id = 1
    for teacher in teachers[:5]:
        for subject in ["Math", "ELA", "Science", "Social Studies"]:
            for i, title in enumerate(assignment_titles[subject][:3]):
                assignment = Assignment(
                    assignment_id=f"assign_{assignment_id}",
                    campus_id=teacher.campus_ids[0],
                    teacher_id=teacher.staff_id,
                    room=Room.ROOM_1 if "Room 1" in teacher.assigned_rooms else Room.ROOM_2,
                    subject=subject,
                    assignment_type=[AssignmentType.QUIZ, AssignmentType.TEST, AssignmentType.HOMEWORK, AssignmentType.PROJECT][i % 4],
                    title=title,
                    description=f"{title} for {subject}",
                    max_points=100,
                    due_date=today + timedelta(days=random.randint(1, 14)),
                    status=AssignmentStatus.PUBLISHED,
                    created_date=today - timedelta(days=random.randint(1, 7))
                )
                assignments_db.append(assignment)
                
                campus_students = [s for s in students_db if s.campus_id == teacher.campus_ids[0]][:8]
                for student in campus_students:
                    points = random.randint(60, 100)
                    letter = "A" if points >= 90 else "B" if points >= 80 else "C" if points >= 70 else "D" if points >= 60 else "F"
                    status_choice = random.choices(
                        [GradeEntryStatus.COMPLETE, GradeEntryStatus.MISSING, GradeEntryStatus.LATE],
                        weights=[85, 10, 5]
                    )[0]
                    
                    entry = GradeEntry(
                        entry_id=f"entry_{assignment_id}_{student.student_id}",
                        assignment_id=assignment.assignment_id,
                        student_id=student.student_id,
                        campus_id=teacher.campus_ids[0],
                        points_earned=points if status_choice == GradeEntryStatus.COMPLETE else None,
                        letter_grade=letter if status_choice == GradeEntryStatus.COMPLETE else None,
                        percentage=float(points) if status_choice == GradeEntryStatus.COMPLETE else None,
                        status=status_choice,
                        comment="Great work!" if points >= 90 else "Good effort" if points >= 80 else "Needs improvement" if status_choice == GradeEntryStatus.COMPLETE else None,
                        submitted_date=today - timedelta(days=random.randint(0, 3)) if status_choice != GradeEntryStatus.MISSING else None,
                        graded_date=today if status_choice == GradeEntryStatus.COMPLETE else None,
                        graded_by=teacher.staff_id
                    )
                    grade_entries_db.append(entry)
                
                assignment_id += 1
    
    announcement_data = [
        {"title": "Welcome Back to School!", "content": "We're excited to start the new school year! Please review the updated handbook.", "category": AnnouncementCategory.GENERAL, "pinned": True},
        {"title": "Parent-Teacher Conferences Next Week", "content": "Sign up for your conference slot through the portal.", "category": AnnouncementCategory.EVENTS, "pinned": True},
        {"title": "Math Competition Results", "content": "Congratulations to our students who placed in the regional math competition!", "category": AnnouncementCategory.ACADEMIC, "pinned": False},
        {"title": "Early Dismissal Friday", "content": "School will dismiss at 12:00 PM this Friday for staff development.", "category": AnnouncementCategory.GENERAL, "pinned": False},
        {"title": "Science Fair Registration Open", "content": "Register for the annual science fair by next Friday.", "category": AnnouncementCategory.ACADEMIC, "pinned": False},
        {"title": "Weather Alert", "content": "Due to severe weather, school will open 2 hours late tomorrow.", "category": AnnouncementCategory.EMERGENCY, "pinned": True},
        {"title": "Field Trip Permission Slips Due", "content": "Please return signed permission slips for the museum field trip.", "category": AnnouncementCategory.EVENTS, "pinned": False},
        {"title": "New Lunch Menu", "content": "Check out our updated lunch menu with healthier options!", "category": AnnouncementCategory.GENERAL, "pinned": False}
    ]
    
    for i, campus in enumerate(campuses_db):
        for j, ann_data in enumerate(announcement_data):
            announcement = Announcement(
                announcement_id=f"ann_{campus.campus_id}_{j+1}",
                campus_id=campus.campus_id,
                title=ann_data["title"],
                content=ann_data["content"],
                category=ann_data["category"],
                status=AnnouncementStatus.PUBLISHED,
                created_by=f"staff_director_{i+1}",
                created_by_role=StaffRole.DIRECTOR,
                approved_by=f"staff_director_{i+1}",
                approved_date=today - timedelta(days=random.randint(0, 5)),
                published_date=today - timedelta(days=random.randint(0, 5)),
                expires_date=today + timedelta(days=30) if not ann_data["pinned"] else None,
                is_pinned=ann_data["pinned"],
                target_roles=["Parent", "Teacher"]
            )
            announcements_db.append(announcement)
    
    for event in events_db:
        if event.requires_rsvp:
            attending_families = random.sample(families_db, min(5, len(families_db)))
            for family in attending_families:
                family_students = [s for s in students_db if s.student_id in family.student_ids]
                for student in family_students[:2]:
                    workflow = EventWorkflow(
                        workflow_id=f"workflow_{event.event_id}_{student.student_id}",
                        event_id=event.event_id,
                        rsvp_id=f"rsvp_{event.event_id}_{family.family_id}",
                        family_id=family.family_id,
                        student_id=student.student_id,
                        status=WorkflowStatus.PENDING if event.requires_permission_slip or event.requires_payment else WorkflowStatus.REGISTERED,
                        permission_slip_signed=not event.requires_permission_slip,
                        permission_slip_signature_id=f"sig_{event.event_id}_{student.student_id}" if not event.requires_permission_slip else None,
                        payment_complete=not event.requires_payment,
                        payment_order_id=f"order_{event.event_id}_{student.student_id}" if not event.requires_payment else None,
                        created_date=today - timedelta(days=random.randint(1, 10)),
                        completed_date=today - timedelta(days=random.randint(0, 5)) if not (event.requires_permission_slip or event.requires_payment) else None
                    )
                    event_workflows_db.append(workflow)
    
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
        "health_records": health_records_db,
        "invoices": invoices_db,
        "invoice_line_items": invoice_line_items_db,
        "payment_plans": payment_plans_db,
        "payment_schedules": payment_schedules_db,
        "leads": leads_db,
        "campus_capacity": campus_capacity_db,
        "message_templates": message_templates_db,
        "broadcast_messages": broadcast_messages_db,
        "automated_alerts": automated_alerts_db,
        "academic_standards": academic_standards_db,
        "standard_assessments": standard_assessments_db,
        "progress_reports": progress_reports_db,
        "iep_504_plans": iep_504_plans_db,
        "accommodations": accommodations_db,
        "iep_goals": iep_goals_db,
        "intervention_plans": intervention_plans_db,
        "intervention_progress": intervention_progress_db,
        "at_risk_assessments": at_risk_assessments_db,
        "retention_predictions": retention_predictions_db,
        "enrollment_forecasts": enrollment_forecasts_db,
        "assignments": assignments_db,
        "grade_entries": grade_entries_db,
        "announcements": announcements_db,
        "announcement_reads": announcement_reads_db,
        "event_workflows": event_workflows_db
    }
