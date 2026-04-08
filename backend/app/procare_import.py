"""
ProCare CSV Import Module
Handles importing student, family, parent, and staff data from ProCare CSV exports.
Auto-detects column mappings from common ProCare export formats.
"""
import csv
import io
import uuid
from datetime import date, datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from .database import get_db
from . import models

router = APIRouter(prefix="/api/import", tags=["ProCare Import"])


def generate_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:8]}"


# --- Column mapping helpers ---
# ProCare exports use various column names. We normalize them to our internal field names.

STUDENT_COLUMN_MAP = {
    # ProCare Online / Desktop common columns -> our fields
    "firstname": "first_name", "first_name": "first_name", "first name": "first_name",
    "child first name": "first_name", "childfirstname": "first_name", "child_first_name": "first_name",
    "student first name": "first_name",
    "lastname": "last_name", "last_name": "last_name", "last name": "last_name",
    "child last name": "last_name", "childlastname": "last_name", "child_last_name": "last_name",
    "student last name": "last_name",
    "child name": "full_name", "childname": "full_name", "student name": "full_name", "name": "full_name",
    "dateofbirth": "date_of_birth", "date_of_birth": "date_of_birth", "date of birth": "date_of_birth",
    "dob": "date_of_birth", "birthdate": "date_of_birth", "birth date": "date_of_birth",
    "grade": "grade", "grade level": "grade", "gradelevel": "grade",
    "classroom": "room", "room": "room", "class": "room", "classname": "room", "class name": "room",
    "status": "status", "enrollment status": "status", "enrollmentstatus": "status", "enrollment_status": "status",
    "familyid": "family_id", "family_id": "family_id", "family id": "family_id",
    "childid": "child_id", "child_id": "child_id", "child id": "child_id",
    "studentid": "student_id", "student_id": "student_id", "student id": "student_id",
    "session": "session",
    "date of admission": "enrollment_start_date", "dateofadmission": "enrollment_start_date",
    "enrollment date": "enrollment_start_date", "enrollmentdate": "enrollment_start_date",
    "enrollment_start_date": "enrollment_start_date", "start date": "enrollment_start_date",
    "funding source": "funding_source", "fundingsource": "funding_source", "funding_source": "funding_source",
    "centername": "campus_name", "center name": "campus_name", "center": "campus_name",
    "campus": "campus_name", "campus_name": "campus_name", "school": "campus_name",
}

FAMILY_COLUMN_MAP = {
    "familyid": "family_id", "family_id": "family_id", "family id": "family_id",
    "family name": "family_name", "familyname": "family_name", "family_name": "family_name",
    "account name": "family_name", "accountname": "family_name",
    "balance": "current_balance", "current_balance": "current_balance", "current balance": "current_balance",
    "amount due": "current_balance", "amountdue": "current_balance",
    "tuition": "monthly_tuition_amount", "monthly tuition": "monthly_tuition_amount",
    "monthlytuition": "monthly_tuition_amount", "tuition amount": "monthly_tuition_amount",
}

PARENT_COLUMN_MAP = {
    "firstname": "first_name", "first_name": "first_name", "first name": "first_name",
    "parent first name": "first_name", "parentfirstname": "first_name", "parent_first_name": "first_name",
    "guardian first name": "first_name", "mother's name": "full_name", "father's name": "full_name",
    "lastname": "last_name", "last_name": "last_name", "last name": "last_name",
    "parent last name": "last_name", "parentlastname": "last_name", "parent_last_name": "last_name",
    "guardian last name": "last_name",
    "parent name": "full_name", "parentname": "full_name", "guardian name": "full_name", "guardian": "full_name",
    "name": "full_name",
    "email": "email", "email address": "email", "emailaddress": "email", "parent email": "email",
    "phone": "phone", "phone number": "phone", "phonenumber": "phone", "home phone": "phone",
    "cell phone": "phone", "mobile": "phone", "parent phone": "phone",
    "relationship": "relationship_type", "relationship_type": "relationship_type",
    "relation": "relationship_type", "type": "relationship_type",
    "familyid": "family_id", "family_id": "family_id", "family id": "family_id",
    "childid": "child_id", "child_id": "child_id", "child id": "child_id",
    "address": "address", "street": "address", "address1": "address",
    "city": "city", "state": "state", "zip": "zip", "zipcode": "zip", "zip code": "zip",
}

STAFF_COLUMN_MAP = {
    "firstname": "first_name", "first_name": "first_name", "first name": "first_name",
    "staff first name": "first_name", "employee first name": "first_name",
    "lastname": "last_name", "last_name": "last_name", "last name": "last_name",
    "staff last name": "last_name", "employee last name": "last_name",
    "name": "full_name", "staff name": "full_name", "employee name": "full_name",
    "email": "email", "email address": "email",
    "phone": "phone", "phone number": "phone",
    "role": "role", "title": "role", "position": "role", "job title": "role",
    "staffid": "staff_id", "staff_id": "staff_id", "staff id": "staff_id",
    "employeeid": "employee_id", "employee_id": "employee_id", "employee id": "employee_id",
    "classroom": "assigned_room", "room": "assigned_room", "assigned room": "assigned_room",
    "hire date": "hire_date", "hiredate": "hire_date", "hire_date": "hire_date",
    "start date": "hire_date",
}


def normalize_columns(headers: List[str], column_map: Dict[str, str]) -> Dict[int, str]:
    """Map CSV column indices to normalized field names."""
    mapping = {}
    for i, header in enumerate(headers):
        normalized = header.strip().lower().replace("_", " ").replace("-", " ")
        # Try exact match first
        if normalized in column_map:
            mapping[i] = column_map[normalized]
        else:
            # Try with underscores
            normalized_underscore = normalized.replace(" ", "_")
            if normalized_underscore in column_map:
                mapping[i] = column_map[normalized_underscore]
            # Try without spaces
            normalized_nospace = normalized.replace(" ", "")
            if normalized_nospace in column_map:
                mapping[i] = column_map[normalized_nospace]
    return mapping


def parse_row(row: List[str], col_mapping: Dict[int, str]) -> Dict[str, str]:
    """Parse a CSV row into a dict using the column mapping."""
    result = {}
    for i, value in enumerate(row):
        if i in col_mapping and value.strip():
            result[col_mapping[i]] = value.strip()
    return result


def split_full_name(full_name: str) -> tuple:
    """Split a full name into first and last name."""
    parts = full_name.strip().split(None, 1)
    if len(parts) == 2:
        return parts[0], parts[1]
    return parts[0] if parts else "Unknown", ""


def parse_date(date_str: str) -> Optional[date]:
    """Try to parse a date string in common formats."""
    if not date_str:
        return None
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y", "%m/%d/%y", "%Y/%m/%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None


def parse_float(value: str) -> Optional[float]:
    """Parse a float from a string, handling currency symbols."""
    if not value:
        return None
    cleaned = value.replace("$", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


# --- Response models ---

class ImportPreview(BaseModel):
    data_type: str
    total_rows: int
    detected_columns: Dict[str, str]  # CSV header -> mapped field
    unmapped_columns: List[str]
    sample_rows: List[Dict[str, str]]


class ImportResult(BaseModel):
    data_type: str
    total_rows: int
    imported: int
    skipped: int
    errors: List[str]


# --- API Endpoints ---

@router.post("/preview")
async def preview_csv(
    file: UploadFile = File(...),
    data_type: str = Query(..., description="Type of data: students, families, parents, staff")
):
    """
    Preview a ProCare CSV file before importing.
    Returns detected column mappings and sample rows.
    """
    if not file.filename or not file.filename.lower().endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Please upload a CSV file (.csv or .txt)")

    content = await file.read()
    try:
        text = content.decode('utf-8-sig')  # Handle BOM
    except UnicodeDecodeError:
        text = content.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="CSV file must have a header row and at least one data row")

    headers = rows[0]

    # Select column map based on data type
    column_maps = {
        "students": STUDENT_COLUMN_MAP,
        "families": FAMILY_COLUMN_MAP,
        "parents": PARENT_COLUMN_MAP,
        "staff": STAFF_COLUMN_MAP,
    }

    if data_type not in column_maps:
        raise HTTPException(status_code=400, detail=f"Invalid data_type. Must be one of: {', '.join(column_maps.keys())}")

    col_mapping = normalize_columns(headers, column_maps[data_type])

    # Build detected columns and unmapped
    detected_columns = {}
    unmapped_columns = []
    for i, header in enumerate(headers):
        if i in col_mapping:
            detected_columns[header] = col_mapping[i]
        else:
            unmapped_columns.append(header)

    # Parse sample rows (up to 5)
    sample_rows = []
    for row in rows[1:6]:
        parsed = parse_row(row, col_mapping)
        if parsed:
            sample_rows.append(parsed)

    return ImportPreview(
        data_type=data_type,
        total_rows=len(rows) - 1,
        detected_columns=detected_columns,
        unmapped_columns=unmapped_columns,
        sample_rows=sample_rows
    )


@router.post("/students", response_model=ImportResult)
async def import_students(
    file: UploadFile = File(...),
    campus_id: str = Query(None, description="Campus ID to assign students to (auto-creates if not provided)"),
    db: DBSession = Depends(get_db)
):
    """Import students from a ProCare CSV export."""
    content = await file.read()
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = content.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="CSV must have header + data rows")

    col_mapping = normalize_columns(rows[0], STUDENT_COLUMN_MAP)
    imported = 0
    skipped = 0
    errors = []

    # Ensure we have a campus
    if not campus_id:
        campus = db.query(models.Campus).first()
        if not campus:
            # Create default campus
            org = db.query(models.Organization).first()
            if not org:
                org = models.Organization(
                    organization_id=generate_id("org_"),
                    name="EPIC Prep Academy",
                    created_date=date.today()
                )
                db.add(org)
                db.commit()
            campus = models.Campus(
                campus_id=generate_id("campus_"),
                organization_id=org.organization_id,
                name="Main Campus",
                location="Main",
                active=True
            )
            db.add(campus)
            db.commit()
        campus_id = campus.campus_id

    # Track families we create to avoid duplicates
    family_cache: Dict[str, str] = {}  # procare_family_id -> our_family_id

    for i, row in enumerate(rows[1:], start=2):
        try:
            data = parse_row(row, col_mapping)
            if not data:
                skipped += 1
                continue

            # Get name
            first_name = data.get("first_name", "")
            last_name = data.get("last_name", "")
            if not first_name and "full_name" in data:
                first_name, last_name = split_full_name(data["full_name"])

            if not first_name:
                skipped += 1
                errors.append(f"Row {i}: Missing student name")
                continue

            # Handle family - create or find
            procare_family_id = data.get("family_id", "")
            if procare_family_id and procare_family_id in family_cache:
                family_id = family_cache[procare_family_id]
            else:
                family_name = f"{last_name} Family" if last_name else f"Family {i}"
                family = models.Family(
                    family_id=generate_id("fam_"),
                    campus_id=campus_id,
                    family_name=family_name,
                    monthly_tuition_amount=0.0,
                    current_balance=0.0,
                    billing_status="Green"
                )
                db.add(family)
                db.flush()
                family_id = family.family_id
                if procare_family_id:
                    family_cache[procare_family_id] = family_id

            # Parse dates
            dob = parse_date(data.get("date_of_birth", ""))
            enrollment_date = parse_date(data.get("enrollment_start_date", ""))

            student = models.Student(
                student_id=generate_id("stu_"),
                campus_id=campus_id,
                first_name=first_name,
                last_name=last_name or "",
                date_of_birth=dob,
                grade=data.get("grade", ""),
                session=data.get("session", "Morning"),
                room=data.get("room", ""),
                status=data.get("status", "Active"),
                family_id=family_id,
                enrollment_start_date=enrollment_date or date.today(),
                funding_source=data.get("funding_source", "Out-of-Pocket"),
                step_up_percentage=0
            )
            db.add(student)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    return ImportResult(
        data_type="students",
        total_rows=len(rows) - 1,
        imported=imported,
        skipped=skipped,
        errors=errors[:20]  # Limit error messages
    )


@router.post("/families", response_model=ImportResult)
async def import_families(
    file: UploadFile = File(...),
    campus_id: str = Query(None, description="Campus ID"),
    db: DBSession = Depends(get_db)
):
    """Import families from a ProCare CSV export."""
    content = await file.read()
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = content.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="CSV must have header + data rows")

    col_mapping = normalize_columns(rows[0], FAMILY_COLUMN_MAP)
    imported = 0
    skipped = 0
    errors = []

    # Ensure campus
    if not campus_id:
        campus = db.query(models.Campus).first()
        if campus:
            campus_id = campus.campus_id
        else:
            raise HTTPException(status_code=400, detail="No campus exists. Please import students first or create a campus.")

    for i, row in enumerate(rows[1:], start=2):
        try:
            data = parse_row(row, col_mapping)
            if not data:
                skipped += 1
                continue

            family_name = data.get("family_name", "")
            if not family_name:
                skipped += 1
                errors.append(f"Row {i}: Missing family name")
                continue

            tuition = parse_float(data.get("monthly_tuition_amount", "0")) or 0.0
            balance = parse_float(data.get("current_balance", "0")) or 0.0

            family = models.Family(
                family_id=generate_id("fam_"),
                campus_id=campus_id,
                family_name=family_name,
                monthly_tuition_amount=tuition,
                current_balance=balance,
                billing_status="Green" if balance <= 0 else ("Yellow" if balance <= tuition else "Red")
            )
            db.add(family)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    return ImportResult(
        data_type="families",
        total_rows=len(rows) - 1,
        imported=imported,
        skipped=skipped,
        errors=errors[:20]
    )


@router.post("/parents", response_model=ImportResult)
async def import_parents(
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db)
):
    """Import parents/guardians from a ProCare CSV export."""
    content = await file.read()
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = content.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="CSV must have header + data rows")

    col_mapping = normalize_columns(rows[0], PARENT_COLUMN_MAP)
    imported = 0
    skipped = 0
    errors = []

    # Get first family as fallback
    default_family = db.query(models.Family).first()

    for i, row in enumerate(rows[1:], start=2):
        try:
            data = parse_row(row, col_mapping)
            if not data:
                skipped += 1
                continue

            first_name = data.get("first_name", "")
            last_name = data.get("last_name", "")
            if not first_name and "full_name" in data:
                first_name, last_name = split_full_name(data["full_name"])

            if not first_name:
                skipped += 1
                errors.append(f"Row {i}: Missing parent name")
                continue

            # Try to find matching family by name
            family_id = None
            if default_family:
                family_id = default_family.family_id

            # If the CSV has a family_id reference, try to match
            # (ProCare family IDs won't match ours directly, but we try name matching)
            parent_last = last_name or first_name
            matching_family = db.query(models.Family).filter(
                models.Family.family_name.ilike(f"%{parent_last}%")
            ).first()
            if matching_family:
                family_id = matching_family.family_id
            elif not family_id:
                # Create a new family for this parent
                family = models.Family(
                    family_id=generate_id("fam_"),
                    campus_id=db.query(models.Campus).first().campus_id if db.query(models.Campus).first() else "campus_default",
                    family_name=f"{parent_last} Family",
                    monthly_tuition_amount=0.0,
                    current_balance=0.0,
                    billing_status="Green"
                )
                db.add(family)
                db.flush()
                family_id = family.family_id

            parent = models.Parent(
                parent_id=generate_id("par_"),
                family_id=family_id,
                first_name=first_name,
                last_name=last_name or "",
                email=data.get("email", ""),
                phone=data.get("phone", ""),
                relationship_type=data.get("relationship_type", "Guardian"),
                primary_guardian=i == 2  # First parent is primary
            )
            db.add(parent)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    return ImportResult(
        data_type="parents",
        total_rows=len(rows) - 1,
        imported=imported,
        skipped=skipped,
        errors=errors[:20]
    )


@router.post("/staff", response_model=ImportResult)
async def import_staff(
    file: UploadFile = File(...),
    campus_id: str = Query(None, description="Campus ID"),
    db: DBSession = Depends(get_db)
):
    """Import staff from a ProCare CSV export."""
    content = await file.read()
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = content.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="CSV must have header + data rows")

    col_mapping = normalize_columns(rows[0], STAFF_COLUMN_MAP)
    imported = 0
    skipped = 0
    errors = []

    # Ensure campus
    if not campus_id:
        campus = db.query(models.Campus).first()
        if campus:
            campus_id = campus.campus_id
        else:
            raise HTTPException(status_code=400, detail="No campus exists. Please create a campus first.")

    for i, row in enumerate(rows[1:], start=2):
        try:
            data = parse_row(row, col_mapping)
            if not data:
                skipped += 1
                continue

            first_name = data.get("first_name", "")
            last_name = data.get("last_name", "")
            if not first_name and "full_name" in data:
                first_name, last_name = split_full_name(data["full_name"])

            if not first_name:
                skipped += 1
                errors.append(f"Row {i}: Missing staff name")
                continue

            # Map ProCare roles to our roles
            raw_role = data.get("role", "Coach").strip()
            role = "Coach"  # Default
            role_lower = raw_role.lower()
            if any(t in role_lower for t in ["owner", "director", "principal", "administrator"]):
                role = "Owner"
            elif any(t in role_lower for t in ["admin", "office", "secretary", "coordinator"]):
                role = "Coach"  # Admins in ProCare are usually staff-level in our system
            elif any(t in role_lower for t in ["teacher", "coach", "instructor", "aide", "assistant"]):
                role = "Coach"

            hire_date = parse_date(data.get("hire_date", ""))
            assigned_room = data.get("assigned_room", "")

            staff = models.Staff(
                staff_id=generate_id("staff_"),
                campus_id=campus_id,
                campus_ids=campus_id,
                first_name=first_name,
                last_name=last_name or "",
                role=role,
                email=data.get("email", ""),
                phone=data.get("phone", ""),
                assigned_rooms=f'["{assigned_room}"]' if assigned_room else '[]',
                permissions="standard",
                active=True,
                hire_date=hire_date or date.today()
            )
            db.add(staff)
            imported += 1

        except Exception as e:
            skipped += 1
            errors.append(f"Row {i}: {str(e)}")

    db.commit()
    return ImportResult(
        data_type="staff",
        total_rows=len(rows) - 1,
        imported=imported,
        skipped=skipped,
        errors=errors[:20]
    )


@router.post("/auto-detect")
async def auto_detect_csv(file: UploadFile = File(...)):
    """
    Auto-detect the type of ProCare CSV export (students, families, parents, or staff).
    Returns the best-guess data type and column mappings.
    """
    content = await file.read()
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = content.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)

    if len(rows) < 1:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    headers = rows[0]

    # Score each type based on how many columns match
    type_scores = {}
    all_maps = {
        "students": STUDENT_COLUMN_MAP,
        "families": FAMILY_COLUMN_MAP,
        "parents": PARENT_COLUMN_MAP,
        "staff": STAFF_COLUMN_MAP,
    }

    for data_type, col_map in all_maps.items():
        mapping = normalize_columns(headers, col_map)
        type_scores[data_type] = len(mapping)

    best_type = max(type_scores, key=type_scores.get)
    best_mapping = normalize_columns(headers, all_maps[best_type])

    detected_columns = {}
    unmapped_columns = []
    for i, header in enumerate(headers):
        if i in best_mapping:
            detected_columns[header] = best_mapping[i]
        else:
            unmapped_columns.append(header)

    return {
        "detected_type": best_type,
        "confidence_scores": type_scores,
        "total_rows": len(rows) - 1 if len(rows) > 1 else 0,
        "detected_columns": detected_columns,
        "unmapped_columns": unmapped_columns,
        "headers": headers
    }
