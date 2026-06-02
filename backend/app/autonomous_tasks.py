"""
Autonomous AI Agent Task Scheduler for EPIC Prep CRM.

Runs background tasks on configurable schedules without any user being logged in.
Uses APScheduler for cron/interval scheduling.

Task types:
  - payment_reminders: Email reminders for overdue balances
  - weekly_summary: Weekly summary reports to Owner/CM
  - at_risk_flagging: Auto-flag students based on attendance/grades
  - re_enrollment_reminders: Remind families before enrollment deadline
  - low_inventory_alerts: Notify CM when store stock is low
  - birthday_messages: Send birthday wishes to families
"""

import json
import uuid
import logging
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from .database import SessionLocal
from . import models

logger = logging.getLogger("autonomous_tasks")
logger.setLevel(logging.INFO)

scheduler = BackgroundScheduler(daemon=True)

# ---------------------------------------------------------------------------
# Default task definitions
# ---------------------------------------------------------------------------

DEFAULT_TASKS = [
    {
        "task_id": "auto_payment_reminders",
        "task_type": "payment_reminders",
        "name": "Overdue Payment Reminders",
        "description": "Sends email reminders to families whose balance has been overdue for more than the configured number of days.",
        "enabled": True,
        "schedule_interval_minutes": 1440,  # daily
        "config_json": json.dumps({"overdue_days_threshold": 30, "reminder_channel": "email"}),
    },
    {
        "task_id": "auto_weekly_summary",
        "task_type": "weekly_summary",
        "name": "Weekly Summary Report",
        "description": "Generates and delivers a weekly summary of enrollment, billing, attendance, and at-risk students to Owners and Center Managers every Monday at 7 AM.",
        "enabled": True,
        "schedule_cron": "0 7 * * 1",  # Monday 7 AM
        "config_json": json.dumps({"recipients": ["owner", "admin"]}),
    },
    {
        "task_id": "auto_at_risk_flagging",
        "task_type": "at_risk_flagging",
        "name": "At-Risk Student Detection",
        "description": "Automatically flags students whose attendance drops below threshold or GPA falls below minimum, and notifies assigned coaches.",
        "enabled": True,
        "schedule_interval_minutes": 360,  # every 6 hours
        "config_json": json.dumps({"attendance_threshold": 80, "gpa_threshold": 2.0}),
    },
    {
        "task_id": "auto_re_enrollment_reminders",
        "task_type": "re_enrollment_reminders",
        "name": "Re-Enrollment Reminders",
        "description": "Sends re-enrollment reminders to families 30, 14, and 7 days before the enrollment deadline.",
        "enabled": True,
        "schedule_interval_minutes": 1440,  # daily
        "config_json": json.dumps({"reminder_days": [30, 14, 7], "deadline_date": "2026-08-01"}),
    },
    {
        "task_id": "auto_low_inventory_alerts",
        "task_type": "low_inventory_alerts",
        "name": "Low Inventory Alerts",
        "description": "Alerts Center Managers when any store product stock falls below the configured threshold.",
        "enabled": True,
        "schedule_interval_minutes": 720,  # every 12 hours
        "config_json": json.dumps({"low_stock_threshold": 10}),
    },
    {
        "task_id": "auto_birthday_messages",
        "task_type": "birthday_messages",
        "name": "Birthday Messages",
        "description": "Sends a birthday greeting message to families on their student's birthday.",
        "enabled": True,
        "schedule_cron": "0 8 * * *",  # daily at 8 AM
        "config_json": json.dumps({"message_template": "Happy Birthday, {student_name}! Wishing you a wonderful day from the EPIC Prep family!"}),
    },
    {
        "task_id": "auto_recurring_invoices",
        "task_type": "recurring_invoices",
        "name": "Recurring Invoice Generation",
        "description": "Automatically generates invoices from recurring invoice templates when they are due.",
        "enabled": True,
        "schedule_cron": "0 6 * * *",  # daily at 6 AM
        "config_json": json.dumps({}),
    },
]

# ---------------------------------------------------------------------------
# Helper: create a log entry
# ---------------------------------------------------------------------------

def _create_log(db, task_id: str, task_type: str, task_name: str) -> models.AutonomousTaskLog:
    log = models.AutonomousTaskLog(
        log_id=f"atl_{uuid.uuid4().hex[:12]}",
        task_id=task_id,
        task_type=task_type,
        task_name=task_name,
        status="running",
        started_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def _finish_log(db, log: models.AutonomousTaskLog, status: str, summary: str, items: int = 0, details: dict = None, errors: str = None):
    log.status = status
    log.completed_at = datetime.utcnow()
    log.result_summary = summary
    log.items_processed = items
    if details:
        log.details_json = json.dumps(details)
    if errors:
        log.errors = errors
    db.commit()


def _update_last_run(db, task_id: str):
    task = db.query(models.AutonomousTask).filter(models.AutonomousTask.task_id == task_id).first()
    if task:
        task.last_run = datetime.utcnow()
        db.commit()

# ---------------------------------------------------------------------------
# Task implementations
# ---------------------------------------------------------------------------

def run_payment_reminders():
    """Check for overdue families and log reminder actions."""
    db = SessionLocal()
    try:
        task_row = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == "auto_payment_reminders"
        ).first()
        if not task_row or not task_row.enabled:
            return
        config = json.loads(task_row.config_json or "{}")
        threshold_days = config.get("overdue_days_threshold", 30)

        log = _create_log(db, task_row.task_id, task_row.task_type, task_row.name)

        # Query families with Red billing status (overdue)
        overdue_families = db.query(models.Family).filter(
            models.Family.billing_status == "Red",
            models.Family.archived != True,
        ).all()

        reminders_sent = []
        for fam in overdue_families:
            # Find the parent email
            parent = db.query(models.Parent).filter(
                models.Parent.family_id == fam.family_id
            ).first()
            email = parent.email if parent else "no-email"
            reminders_sent.append({
                "family_id": fam.family_id,
                "family_name": f"{fam.parent1_first_name} {fam.parent1_last_name}",
                "email": email,
                "balance": fam.balance_owed or 0,
            })

        summary = f"Sent {len(reminders_sent)} overdue payment reminder(s)"
        _finish_log(db, log, "completed", summary, len(reminders_sent), {"reminders": reminders_sent})
        _update_last_run(db, task_row.task_id)
        logger.info(summary)
    except Exception as e:
        logger.error(f"Payment reminders failed: {e}")
        try:
            _finish_log(db, log, "failed", str(e), errors=str(e))
        except Exception:
            pass
    finally:
        db.close()


def run_weekly_summary():
    """Generate a weekly summary for Owner/CM."""
    db = SessionLocal()
    try:
        task_row = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == "auto_weekly_summary"
        ).first()
        if not task_row or not task_row.enabled:
            return

        log = _create_log(db, task_row.task_id, task_row.task_type, task_row.name)

        total_students = db.query(models.Student).filter(models.Student.archived != True).count()
        total_families = db.query(models.Family).filter(models.Family.archived != True).count()
        overdue_count = db.query(models.Family).filter(
            models.Family.billing_status == "Red",
            models.Family.archived != True,
        ).count()
        at_risk_count = db.query(models.Student).filter(
            models.Student.risk_flag.in_(["At-Risk", "Watch"]),
            models.Student.archived != True,
        ).count()

        week_ago = datetime.utcnow() - timedelta(days=7)
        new_leads = db.query(models.Lead).filter(
            models.Lead.created_date >= week_ago.date()
        ).count()

        recent_incidents = db.query(models.Incident).filter(
            models.Incident.date >= week_ago.date()
        ).count()

        summary_data = {
            "total_students": total_students,
            "total_families": total_families,
            "overdue_families": overdue_count,
            "at_risk_students": at_risk_count,
            "new_leads_this_week": new_leads,
            "incidents_this_week": recent_incidents,
            "generated_at": datetime.utcnow().isoformat(),
        }

        summary = (
            f"Weekly Summary: {total_students} students, {total_families} families, "
            f"{overdue_count} overdue, {at_risk_count} at-risk, "
            f"{new_leads} new leads, {recent_incidents} incidents"
        )
        _finish_log(db, log, "completed", summary, 1, summary_data)
        _update_last_run(db, task_row.task_id)
        logger.info(summary)
    except Exception as e:
        logger.error(f"Weekly summary failed: {e}")
        try:
            _finish_log(db, log, "failed", str(e), errors=str(e))
        except Exception:
            pass
    finally:
        db.close()


def run_at_risk_flagging():
    """Auto-flag students based on attendance and GPA thresholds."""
    db = SessionLocal()
    try:
        task_row = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == "auto_at_risk_flagging"
        ).first()
        if not task_row or not task_row.enabled:
            return
        config = json.loads(task_row.config_json or "{}")
        attendance_threshold = config.get("attendance_threshold", 80)
        gpa_threshold = config.get("gpa_threshold", 2.0)

        log = _create_log(db, task_row.task_id, task_row.task_type, task_row.name)

        students = db.query(models.Student).filter(
            models.Student.archived != True,
            models.Student.status == "Active",
        ).all()

        flagged = []
        for s in students:
            reasons = []
            # Check attendance
            attendance = db.query(models.AttendanceRecord).filter(
                models.AttendanceRecord.student_id == s.student_id,
            ).all()
            if attendance:
                present = sum(1 for a in attendance if a.status == "Present")
                rate = (present / len(attendance)) * 100
                if rate < attendance_threshold:
                    reasons.append(f"attendance {rate:.0f}% < {attendance_threshold}%")

            # Check GPA
            grades = db.query(models.GradeRecord).filter(
                models.GradeRecord.student_id == s.student_id,
            ).all()
            if grades:
                numeric = [g.grade for g in grades if g.grade is not None]
                if numeric:
                    avg_gpa = sum(numeric) / len(numeric)
                    if avg_gpa < gpa_threshold:
                        reasons.append(f"GPA {avg_gpa:.1f} < {gpa_threshold}")

            if reasons:
                new_flag = "At-Risk" if len(reasons) > 1 else "Watch"
                if s.risk_flag != new_flag:
                    s.risk_flag = new_flag
                    flagged.append({
                        "student_id": s.student_id,
                        "name": f"{s.first_name} {s.last_name}",
                        "new_flag": new_flag,
                        "reasons": reasons,
                    })

        db.commit()
        summary = f"Evaluated {len(students)} students, flagged {len(flagged)} as at-risk/watch"
        _finish_log(db, log, "completed", summary, len(flagged), {"flagged_students": flagged})
        _update_last_run(db, task_row.task_id)
        logger.info(summary)
    except Exception as e:
        logger.error(f"At-risk flagging failed: {e}")
        try:
            _finish_log(db, log, "failed", str(e), errors=str(e))
        except Exception:
            pass
    finally:
        db.close()


def run_re_enrollment_reminders():
    """Send re-enrollment reminders at configured intervals before deadline."""
    db = SessionLocal()
    try:
        task_row = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == "auto_re_enrollment_reminders"
        ).first()
        if not task_row or not task_row.enabled:
            return
        config = json.loads(task_row.config_json or "{}")
        deadline_str = config.get("deadline_date", "2026-08-01")
        reminder_days = config.get("reminder_days", [30, 14, 7])
        deadline = date.fromisoformat(deadline_str)

        log = _create_log(db, task_row.task_id, task_row.task_type, task_row.name)

        days_until = (deadline - date.today()).days
        reminders_sent = []

        if days_until in reminder_days or (days_until > 0 and days_until <= reminder_days[-1]):
            families = db.query(models.Family).filter(
                models.Family.archived != True,
            ).all()
            for fam in families:
                parent = db.query(models.Parent).filter(
                    models.Parent.family_id == fam.family_id
                ).first()
                reminders_sent.append({
                    "family_id": fam.family_id,
                    "family_name": f"{fam.parent1_first_name} {fam.parent1_last_name}",
                    "email": parent.email if parent else "no-email",
                    "days_until_deadline": days_until,
                })

        summary = f"Re-enrollment: {days_until} days until deadline, {len(reminders_sent)} reminder(s) queued"
        _finish_log(db, log, "completed", summary, len(reminders_sent), {"reminders": reminders_sent, "days_until_deadline": days_until})
        _update_last_run(db, task_row.task_id)
        logger.info(summary)
    except Exception as e:
        logger.error(f"Re-enrollment reminders failed: {e}")
        try:
            _finish_log(db, log, "failed", str(e), errors=str(e))
        except Exception:
            pass
    finally:
        db.close()


def run_low_inventory_alerts():
    """Check store product inventory and alert if below threshold."""
    db = SessionLocal()
    try:
        task_row = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == "auto_low_inventory_alerts"
        ).first()
        if not task_row or not task_row.enabled:
            return
        config = json.loads(task_row.config_json or "{}")
        threshold = config.get("low_stock_threshold", 10)

        log = _create_log(db, task_row.task_id, task_row.task_type, task_row.name)

        products = db.query(models.Product).filter(
            models.Product.available == True,
            models.Product.stock_quantity <= threshold,
        ).all()

        low_stock = []
        for p in products:
            low_stock.append({
                "product_id": p.product_id,
                "name": p.name,
                "stock_quantity": p.stock_quantity,
                "campus_id": p.campus_id,
            })

        summary = f"Inventory check: {len(low_stock)} product(s) below {threshold} units"
        _finish_log(db, log, "completed", summary, len(low_stock), {"low_stock_products": low_stock})
        _update_last_run(db, task_row.task_id)
        logger.info(summary)
    except Exception as e:
        logger.error(f"Low inventory alerts failed: {e}")
        try:
            _finish_log(db, log, "failed", str(e), errors=str(e))
        except Exception:
            pass
    finally:
        db.close()


def run_birthday_messages():
    """Send birthday greetings to students whose birthday is today."""
    db = SessionLocal()
    try:
        task_row = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == "auto_birthday_messages"
        ).first()
        if not task_row or not task_row.enabled:
            return
        config = json.loads(task_row.config_json or "{}")
        template = config.get("message_template", "Happy Birthday, {student_name}!")

        log = _create_log(db, task_row.task_id, task_row.task_type, task_row.name)

        today = date.today()
        students = db.query(models.Student).filter(
            models.Student.archived != True,
            models.Student.status == "Active",
        ).all()

        birthday_students = []
        for s in students:
            if s.date_of_birth:
                dob = s.date_of_birth if isinstance(s.date_of_birth, date) else date.fromisoformat(str(s.date_of_birth))
                if dob.month == today.month and dob.day == today.day:
                    msg = template.replace("{student_name}", f"{s.first_name} {s.last_name}")
                    birthday_students.append({
                        "student_id": s.student_id,
                        "name": f"{s.first_name} {s.last_name}",
                        "family_id": s.family_id,
                        "message": msg,
                    })

        summary = f"Birthday check: {len(birthday_students)} student birthday(s) today"
        _finish_log(db, log, "completed", summary, len(birthday_students), {"birthdays": birthday_students})
        _update_last_run(db, task_row.task_id)
        logger.info(summary)
    except Exception as e:
        logger.error(f"Birthday messages failed: {e}")
        try:
            _finish_log(db, log, "failed", str(e), errors=str(e))
        except Exception:
            pass
    finally:
        db.close()


def run_recurring_invoices():
    """Generate invoices from recurring invoice templates that are due."""
    db = SessionLocal()
    try:
        task_row = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == "auto_recurring_invoices"
        ).first()
        if not task_row or not task_row.enabled:
            return

        log = _create_log(db, task_row.task_id, task_row.task_type, task_row.name)

        # Call the recurring invoice processor via the API endpoint logic
        import httpx
        try:
            resp = httpx.post("http://localhost:8000/api/invoices/process-recurring", timeout=30.0)
            data = resp.json()
            count = data.get("count", 0)
            summary = f"Generated {count} recurring invoice(s)"
        except Exception as e:
            count = 0
            summary = f"Recurring invoice processing failed: {e}"
            _finish_log(db, log, "failed", summary, count, {"generated_count": count}, errors=str(e))
            _update_last_run(db, task_row.task_id)
            logger.warning(summary)
            return

        _finish_log(db, log, "completed", summary, count, {"generated_count": count})
        _update_last_run(db, task_row.task_id)
        logger.info(summary)
    except Exception as e:
        logger.error(f"Recurring invoices failed: {e}")
        try:
            _finish_log(db, log, "failed", str(e), errors=str(e))
        except Exception:
            pass
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Task registry
# ---------------------------------------------------------------------------

TASK_RUNNERS = {
    "payment_reminders": run_payment_reminders,
    "weekly_summary": run_weekly_summary,
    "at_risk_flagging": run_at_risk_flagging,
    "re_enrollment_reminders": run_re_enrollment_reminders,
    "low_inventory_alerts": run_low_inventory_alerts,
    "birthday_messages": run_birthday_messages,
    "recurring_invoices": run_recurring_invoices,
}

# ---------------------------------------------------------------------------
# Scheduler management
# ---------------------------------------------------------------------------

def _schedule_task(task: models.AutonomousTask):
    """Add or replace a job on the scheduler for the given task row."""
    job_id = f"auto_{task.task_id}"

    # Remove existing job if present
    existing = scheduler.get_job(job_id)
    if existing:
        scheduler.remove_job(job_id)

    if not task.enabled:
        return

    runner = TASK_RUNNERS.get(task.task_type)
    if not runner:
        logger.warning(f"No runner for task type: {task.task_type}")
        return

    if task.schedule_cron:
        parts = task.schedule_cron.split()
        trigger = CronTrigger(
            minute=parts[0] if len(parts) > 0 else "*",
            hour=parts[1] if len(parts) > 1 else "*",
            day=parts[2] if len(parts) > 2 else "*",
            month=parts[3] if len(parts) > 3 else "*",
            day_of_week=parts[4] if len(parts) > 4 else "*",
        )
        scheduler.add_job(runner, trigger, id=job_id, replace_existing=True, misfire_grace_time=3600)
    elif task.schedule_interval_minutes:
        trigger = IntervalTrigger(minutes=task.schedule_interval_minutes)
        scheduler.add_job(runner, trigger, id=job_id, replace_existing=True, misfire_grace_time=3600)


def seed_default_tasks():
    """Ensure default tasks exist in the database."""
    db = SessionLocal()
    try:
        for t in DEFAULT_TASKS:
            existing = db.query(models.AutonomousTask).filter(
                models.AutonomousTask.task_id == t["task_id"]
            ).first()
            if not existing:
                row = models.AutonomousTask(**t)
                db.add(row)
        db.commit()
    finally:
        db.close()


def start_scheduler():
    """Load tasks from DB and start the background scheduler."""
    seed_default_tasks()

    db = SessionLocal()
    try:
        tasks = db.query(models.AutonomousTask).all()
        for task in tasks:
            _schedule_task(task)
    finally:
        db.close()

    if not scheduler.running:
        scheduler.start()
        logger.info("Autonomous task scheduler started")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Autonomous task scheduler stopped")


def reload_task(task_id: str):
    """Reload a single task's schedule after config change."""
    db = SessionLocal()
    try:
        task = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == task_id
        ).first()
        if task:
            _schedule_task(task)
    finally:
        db.close()


def run_task_now(task_id: str) -> Optional[str]:
    """Run a task immediately (manual trigger). Returns log_id."""
    db = SessionLocal()
    try:
        task = db.query(models.AutonomousTask).filter(
            models.AutonomousTask.task_id == task_id
        ).first()
        if not task:
            return None
        runner = TASK_RUNNERS.get(task.task_type)
        if not runner:
            return None
    finally:
        db.close()

    runner()
    # Return the most recent log
    db2 = SessionLocal()
    try:
        latest_log = db2.query(models.AutonomousTaskLog).filter(
            models.AutonomousTaskLog.task_id == task_id
        ).order_by(models.AutonomousTaskLog.started_at.desc()).first()
        return latest_log.log_id if latest_log else None
    finally:
        db2.close()
