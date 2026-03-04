"""
Database seeding module for EPIC CRM
Seeds the database with demo data on first startup
"""
from datetime import date, datetime, timedelta
import random
import json
from sqlalchemy.orm import Session
from . import models
from .database import SessionLocal


def is_database_empty(db: Session) -> bool:
    """Check if the database has any data"""
    return db.query(models.Organization).count() == 0


def seed_database():
    """Seed the database with demo data if empty"""
    db = SessionLocal()
    try:
        if not is_database_empty(db):
            print("Database already has data, skipping seed")
            return
        
        print("Seeding database with demo data...")
        
        # Create organization
        org = models.Organization(
            organization_id="org_1",
            name="Epic Prep Academy",
            created_date=date(2020, 1, 1)
        )
        db.add(org)
        db.flush()
        
        # Create campuses
        campus_data = [
            {"name": "Pace Campus", "location": "Pace, FL", "address": "123 School St, Pace, FL 32571", "phone": "850-555-0100"},
            {"name": "Crestview Campus", "location": "Crestview, FL", "address": "456 Education Ave, Crestview, FL 32536", "phone": "850-555-0200"},
            {"name": "Navarre Campus", "location": "Navarre, FL", "address": "789 Learning Ln, Navarre, FL 32566", "phone": "850-555-0300"}
        ]
        
        campuses = []
        for i, campus_info in enumerate(campus_data):
            campus = models.Campus(
                campus_id=f"campus_{i+1}",
                organization_id=org.organization_id,
                name=campus_info["name"],
                location=campus_info["location"],
                address=campus_info["address"],
                phone=campus_info["phone"],
                email=f"{campus_info['location'].split(',')[0].lower()}@epicprepacademy.com",
                active=True
            )
            db.add(campus)
            campuses.append(campus)
        db.flush()
        
        # Create staff
        staff_data = [
            {"first_name": "Sarah", "last_name": "Mitchell", "role": "Owner", "rooms": [], "campus_idx": 0},
            {"first_name": "Jennifer", "last_name": "Kilgore", "role": "Assistant", "rooms": ["Room 1"], "campus_idx": 0},
            {"first_name": "Brittany", "last_name": "Kilcrease", "role": "Admin", "rooms": [], "campus_idx": 1},
            {"first_name": "Pam", "last_name": "Riffle", "role": "Teacher", "rooms": ["Room 2"], "campus_idx": 0},
            {"first_name": "Sami", "last_name": "Flores", "role": "Teacher", "rooms": ["Room 3"], "campus_idx": 1},
            {"first_name": "Jewel", "last_name": "Brooks", "role": "Teacher", "rooms": ["Room 1"], "campus_idx": 2},
            {"first_name": "Crislynn", "last_name": "Giles", "role": "Teacher", "rooms": ["Room 4"], "campus_idx": 2},
        ]
        
        staff_members = []
        for i, staff_info in enumerate(staff_data):
            staff = models.Staff(
                staff_id=f"staff_{i+1}",
                campus_id=campuses[staff_info["campus_idx"]].campus_id,
                first_name=staff_info["first_name"],
                last_name=staff_info["last_name"],
                role=staff_info["role"],
                email=f"{staff_info['first_name'].lower()}.{staff_info['last_name'].lower()}@epicprepacademy.com",
                phone=f"850-555-{1000+i}",
                assigned_rooms=json.dumps(staff_info["rooms"]),
                permissions="Admin" if staff_info["role"] in ["Owner", "Admin"] else "Teacher",
                active=True,
                hire_date=date(2024, 1, 1)
            )
            db.add(staff)
            staff_members.append(staff)
        db.flush()
        
        # Name lists for generating data
        first_names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William",
                       "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
                       "Abigail", "Michael", "Emily", "Daniel", "Elizabeth", "Matthew", "Sofia", "Jackson", "Avery", "Sebastian"]
        
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                      "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
        
        # Create families and students
        num_families = 20
        student_counter = 1
        parent_counter = 1
        
        for fam_idx in range(num_families):
            family_id = f"family_{fam_idx + 1}"
            family_last_name = random.choice(last_names)
            family_campus = random.choice(campuses)
            
            num_children = random.choices([1, 2, 3], weights=[0.4, 0.45, 0.15])[0]
            
            # Determine billing status
            billing_status_choice = random.choices(
                ["Green", "Yellow", "Red"],
                weights=[0.6, 0.15, 0.25]
            )[0]
            
            if billing_status_choice == "Green":
                current_balance = round(random.uniform(0, 50), 2)
            elif billing_status_choice == "Yellow":
                current_balance = round(random.uniform(50, 200), 2)
            else:
                current_balance = round(random.uniform(200, 800), 2)
            
            monthly_tuition = num_children * 833.33
            
            # Create family
            family = models.Family(
                family_id=family_id,
                campus_id=family_campus.campus_id,
                family_name=f"The {family_last_name} Family",
                monthly_tuition_amount=round(monthly_tuition, 2),
                current_balance=current_balance,
                billing_status=billing_status_choice,
                last_payment_date=date.today() - timedelta(days=random.randint(1, 30)) if billing_status_choice == "Green" else None,
                last_payment_amount=round(monthly_tuition, 2) if billing_status_choice == "Green" else None
            )
            db.add(family)
            db.flush()
            
            # Create parents
            num_parents = random.choice([1, 2])
            primary_parent_id = None
            
            for p_idx in range(num_parents):
                parent_id = f"parent_{parent_counter}"
                parent_counter += 1
                
                parent = models.Parent(
                    parent_id=parent_id,
                    family_id=family_id,
                    first_name=random.choice(first_names),
                    last_name=family_last_name,
                    email=f"{parent_id}@email.com",
                    phone=f"850-{random.randint(100,999)}-{random.randint(1000,9999)}",
                    relationship_type=["Mother", "Father", "Guardian"][p_idx % 3],
                    primary_guardian=(p_idx == 0),
                    preferred_contact_method=random.choice(["Text", "Email", "App"])
                )
                db.add(parent)
                
                if p_idx == 0:
                    primary_parent_id = parent_id
            
            # Update family with primary parent
            family.primary_parent_id = primary_parent_id
            db.flush()
            
            # Create students
            for child_idx in range(num_children):
                student_id = f"student_{student_counter}"
                student_counter += 1
                
                grade = random.choice(["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"])
                
                if grade in ["K", "1", "2", "3", "4", "5", "6", "7"]:
                    session = "Morning"
                else:
                    session = "Afternoon"
                
                if grade in ["K", "1", "2"]:
                    room = "Room 1"
                elif grade in ["3", "4", "5", "8", "9"]:
                    room = "Room 2"
                elif grade in ["6", "7", "10", "11"]:
                    room = "Room 3"
                else:
                    room = "Room 4"
                
                # Performance profile
                performance_profile = random.choices(
                    ["excellent", "average", "struggling"],
                    weights=[0.60, 0.25, 0.15]
                )[0]
                
                if performance_profile == "excellent":
                    attendance_present = random.randint(18, 20)
                    attendance_absent = random.randint(0, 1)
                    attendance_tardy = random.randint(0, 1)
                    grade_flag = "On track"
                    ixl_status = "On track"
                elif performance_profile == "average":
                    attendance_present = random.randint(16, 18)
                    attendance_absent = random.randint(1, 3)
                    attendance_tardy = random.randint(0, 2)
                    grade_flag = random.choice(["On track", "Needs attention"])
                    ixl_status = random.choice(["On track", "Needs attention"])
                else:
                    attendance_present = random.randint(12, 16)
                    attendance_absent = random.randint(4, 7)
                    attendance_tardy = random.randint(2, 4)
                    grade_flag = random.choice(["Needs attention", "Failing"])
                    ixl_status = "Needs attention"
                
                # Risk flag
                if grade_flag == "Failing" or attendance_absent >= 5:
                    risk_flag = "At risk"
                elif grade_flag == "Needs attention" or attendance_absent >= 3:
                    risk_flag = "Watch"
                else:
                    risk_flag = "None"
                
                # Birth year
                if grade == "K":
                    birth_year = 2019
                else:
                    try:
                        birth_year = 2024 - int(grade) - 5
                    except ValueError:
                        birth_year = 2019
                
                # Funding source
                step_up_pct = random.choice([0, 50, 100])
                if step_up_pct == 0:
                    funding_source = "Out-of-Pocket"
                elif step_up_pct == 100:
                    funding_source = "Step-Up"
                else:
                    funding_source = "Mixed"
                
                student = models.Student(
                    student_id=student_id,
                    campus_id=family_campus.campus_id,
                    first_name=random.choice(first_names),
                    last_name=family_last_name,
                    date_of_birth=date(birth_year, random.randint(1, 12), random.randint(1, 28)),
                    grade=grade,
                    session=session,
                    room=room,
                    status="Active",
                    family_id=family_id,
                    enrollment_start_date=date(2024, 8, 15),
                    attendance_present_count=attendance_present,
                    attendance_absent_count=attendance_absent,
                    attendance_tardy_count=attendance_tardy,
                    overall_grade_flag=grade_flag,
                    ixl_status_flag=ixl_status,
                    overall_risk_flag=risk_flag,
                    funding_source=funding_source,
                    step_up_percentage=step_up_pct
                )
                db.add(student)
                db.flush()
                
                # Create grade records
                subjects = ["Math", "ELA", "Science", "Social Studies"]
                for subject in subjects:
                    if grade_flag == "On track":
                        grade_value = random.choice(["A", "A", "B", "B", "C"])
                    elif grade_flag == "Needs attention":
                        grade_value = random.choice(["B", "C", "C", "D"])
                    else:
                        grade_value = random.choice(["C", "D", "D", "F"])
                    
                    grade_record = models.GradeRecord(
                        grade_record_id=f"grade_{student_id}_{subject}",
                        campus_id=family_campus.campus_id,
                        student_id=student_id,
                        subject=subject,
                        term="Current Term",
                        grade_value=grade_value,
                        grade_percentage={"A": 95, "B": 85, "C": 75, "D": 65, "F": 55}.get(grade_value, 75),
                        is_failing=(grade_value in ["D", "F"]),
                        recorded_date=date.today()
                    )
                    db.add(grade_record)
                
                # Create attendance records for last 20 school days
                for day_offset in range(20):
                    record_date = date.today() - timedelta(days=day_offset)
                    if record_date.weekday() >= 5:  # Skip weekends
                        continue
                    
                    # Determine status based on counts
                    rand_val = random.random()
                    total = attendance_present + attendance_absent + attendance_tardy
                    if total == 0:
                        status = "Present"
                    elif rand_val < attendance_present / total:
                        status = "Present"
                    elif rand_val < (attendance_present + attendance_absent) / total:
                        status = "Absent"
                    else:
                        status = "Tardy"
                    
                    attendance = models.AttendanceRecord(
                        attendance_id=f"att_{student_id}_{day_offset}",
                        campus_id=family_campus.campus_id,
                        student_id=student_id,
                        date=record_date,
                        status=status,
                        session=session,
                        recorded_by=staff_members[0].staff_id,
                        recorded_at=datetime.now()
                    )
                    db.add(attendance)
                
                # Create health record
                health_record = models.HealthRecord(
                    health_record_id=f"health_{student_id}",
                    campus_id=family_campus.campus_id,
                    student_id=student_id,
                    allergies=json.dumps(random.choice([[], ["Peanuts"], ["Dairy"], ["None"]])),
                    medications=json.dumps([]),
                    medical_conditions=json.dumps([]),
                    emergency_contact_name=f"{random.choice(first_names)} {family_last_name}",
                    emergency_contact_phone=f"850-{random.randint(100,999)}-{random.randint(1000,9999)}",
                    emergency_contact_relationship="Parent",
                    last_updated=date.today()
                )
                db.add(health_record)
            
            # Create billing records
            for month_offset in range(3):
                record_date = date.today() - timedelta(days=30 * month_offset)
                billing_record = models.BillingRecord(
                    billing_record_id=f"bill_{family_id}_{month_offset}",
                    campus_id=family_campus.campus_id,
                    family_id=family_id,
                    date=record_date,
                    type="Charge",
                    description=f"Monthly Tuition - {record_date.strftime('%B %Y')}",
                    amount=round(monthly_tuition, 2),
                    category="Tuition",
                    period_month=record_date.strftime('%Y-%m')
                )
                db.add(billing_record)
                
                # Add payment if billing status is green
                if billing_status_choice == "Green" and month_offset > 0:
                    payment_record = models.BillingRecord(
                        billing_record_id=f"pay_{family_id}_{month_offset}",
                        campus_id=family_campus.campus_id,
                        family_id=family_id,
                        date=record_date + timedelta(days=5),
                        type="Payment",
                        description=f"Payment Received",
                        amount=round(monthly_tuition, 2),
                        source="Out-of-Pocket",
                        category="Tuition",
                        period_month=record_date.strftime('%Y-%m')
                    )
                    db.add(payment_record)
        
        # Create some leads
        lead_stages = ["New Inquiry", "Contacted", "Tour Scheduled", "Toured", "Application Submitted"]
        lead_sources = ["Website", "Referral", "Social Media", "Walk-in", "Event"]
        
        for i in range(10):
            lead = models.Lead(
                lead_id=f"lead_{i+1}",
                campus_id=random.choice(campuses).campus_id,
                parent_first_name=random.choice(first_names),
                parent_last_name=random.choice(last_names),
                email=f"lead{i+1}@email.com",
                phone=f"850-{random.randint(100,999)}-{random.randint(1000,9999)}",
                child_first_name=random.choice(first_names),
                child_last_name=random.choice(last_names),
                child_dob=date(2018, random.randint(1, 12), random.randint(1, 28)),
                desired_grade=random.choice(["K", "1", "2", "3", "4", "5"]),
                desired_start_date=date(2025, 8, 15),
                stage=random.choice(lead_stages),
                source=random.choice(lead_sources),
                created_date=date.today() - timedelta(days=random.randint(1, 60)),
                notes="Interested in enrollment"
            )
            db.add(lead)
        
        # Create some events
        event_types = ["Field Trip", "School Event", "Fundraiser", "Performance", "Parent Night"]
        for i in range(5):
            event = models.Event(
                event_id=f"event_{i+1}",
                campus_id=random.choice(campuses).campus_id,
                title=f"Upcoming {random.choice(event_types)}",
                description="Join us for this exciting event!",
                event_type=random.choice(event_types),
                date=date.today() + timedelta(days=random.randint(7, 60)),
                time="10:00 AM",
                location="School Campus",
                requires_rsvp=random.choice([True, False]),
                requires_permission_slip=random.choice([True, False]),
                requires_payment=random.choice([True, False]),
                payment_amount=25.00 if random.random() > 0.5 else None,
                created_by_staff_id=staff_members[0].staff_id
            )
            db.add(event)
        
        # Create some products for the store
        products = [
            {"name": "School T-Shirt", "description": "Official EPIC Prep Academy t-shirt", "category": "Apparel", "price": 25.00},
            {"name": "School Hoodie", "description": "Official EPIC Prep Academy hoodie", "category": "Apparel", "price": 45.00},
            {"name": "Backpack", "description": "EPIC Prep Academy backpack", "category": "Supplies", "price": 35.00},
            {"name": "Water Bottle", "description": "Reusable water bottle with school logo", "category": "Supplies", "price": 15.00},
            {"name": "Field Trip Fee", "description": "Standard field trip participation fee", "category": "Event Fee", "price": 20.00},
        ]
        
        for i, prod in enumerate(products):
            product = models.Product(
                product_id=f"prod_{i+1}",
                name=prod["name"],
                description=prod["description"],
                category=prod["category"],
                price=prod["price"],
                available=True
            )
            db.add(product)
        
        # Create some announcements
        announcements = [
            {"title": "Welcome Back!", "content": "Welcome to the new school year at EPIC Prep Academy!", "category": "General"},
            {"title": "Picture Day", "content": "School picture day is coming up next week. Please dress appropriately.", "category": "Event"},
            {"title": "Parent-Teacher Conferences", "content": "Sign up for parent-teacher conferences through the app.", "category": "Academic"},
        ]
        
        for i, ann in enumerate(announcements):
            announcement = models.Announcement(
                announcement_id=f"ann_{i+1}",
                campus_id=campuses[0].campus_id,
                title=ann["title"],
                content=ann["content"],
                category=ann["category"],
                status="Published",
                priority="Normal",
                created_by=staff_members[0].staff_id,
                created_date=datetime.now() - timedelta(days=i * 7),
                publish_date=datetime.now() - timedelta(days=i * 7),
                target_audience="All"
            )
            db.add(announcement)
        
        db.commit()
        print(f"Database seeded successfully with {num_families} families and {student_counter - 1} students")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()
