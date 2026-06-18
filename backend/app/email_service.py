"""
Email service for EPIC CRM.
Sends real emails via SendGrid when SENDGRID_API_KEY is configured.
Falls back to logging when no API key is set.
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger("epic.email")

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@epicprepacademy.com")
FROM_NAME = os.getenv("FROM_NAME", "EPIC Prep Academy")


def _is_configured() -> bool:
    return bool(SENDGRID_API_KEY)


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    plain_content: Optional[str] = None,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
    reply_to: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Send an email via SendGrid.
    Returns {"success": True/False, "message": str, "provider": "sendgrid"|"log"}
    """
    sender_email = from_email or FROM_EMAIL
    sender_name = from_name or FROM_NAME

    if not _is_configured():
        logger.info(
            f"[EMAIL-LOG] To: {to_email} | Subject: {subject} | "
            f"From: {sender_name} <{sender_email}> | "
            f"(SendGrid not configured — email logged only)"
        )
        return {
            "success": True,
            "message": "Email logged (SendGrid not configured)",
            "provider": "log",
            "timestamp": datetime.now().isoformat(),
        }

    try:
        import httpx
        payload = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": sender_email, "name": sender_name},
            "subject": subject,
            "content": [],
        }
        if plain_content:
            payload["content"].append({"type": "text/plain", "value": plain_content})
        payload["content"].append({"type": "text/html", "value": html_content})

        if reply_to:
            payload["reply_to"] = {"email": reply_to}

        if attachments:
            payload["attachments"] = attachments

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={
                    "Authorization": f"Bearer {SENDGRID_API_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )

        if resp.status_code in (200, 201, 202):
            logger.info(f"[EMAIL-SENT] To: {to_email} | Subject: {subject}")
            return {
                "success": True,
                "message": "Email sent successfully",
                "provider": "sendgrid",
                "timestamp": datetime.now().isoformat(),
            }
        else:
            logger.error(
                f"[EMAIL-FAIL] To: {to_email} | Subject: {subject} | "
                f"Status: {resp.status_code} | Body: {resp.text}"
            )
            return {
                "success": False,
                "message": f"SendGrid error: {resp.status_code}",
                "provider": "sendgrid",
                "timestamp": datetime.now().isoformat(),
            }
    except Exception as e:
        logger.error(f"[EMAIL-ERROR] To: {to_email} | Error: {str(e)}")
        return {
            "success": False,
            "message": f"Email error: {str(e)}",
            "provider": "sendgrid",
            "timestamp": datetime.now().isoformat(),
        }


async def send_receipt_email(
    to_email: str,
    parent_name: str,
    order_items: List[Dict[str, Any]],
    total: float,
    payment_method: str,
    order_id: str,
) -> Dict[str, Any]:
    """Send a store purchase receipt email."""
    items_html = ""
    for item in order_items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.get('name', '')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.get('price', 0):.2f}</td>
        </tr>"""

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">EPIC Prep Academy</h1>
            <p style="margin: 5px 0 0;">Purchase Receipt</p>
        </div>
        <div style="padding: 20px;">
            <p>Hi {parent_name},</p>
            <p>Thank you for your purchase! Here's your receipt:</p>
            <p><strong>Order #:</strong> {order_id}</p>
            <p><strong>Payment Method:</strong> {payment_method}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 8px; text-align: left;">Item</th>
                        <th style="padding: 8px; text-align: center;">Qty</th>
                        <th style="padding: 8px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>{items_html}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                        <td style="padding: 8px; text-align: right; font-weight: bold;">${total:.2f}</td>
                    </tr>
                </tfoot>
            </table>
            <p style="color: #6b7280; font-size: 14px;">If you have questions about this purchase, please contact your campus front office.</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            EPIC Prep Academy &mdash; Empowering Students Through Excellence
        </div>
    </div>
    """
    return await send_email(
        to_email=to_email,
        subject=f"EPIC Prep Academy - Purchase Receipt #{order_id}",
        html_content=html,
        plain_content=f"Receipt for order {order_id}. Total: ${total:.2f}. Payment: {payment_method}.",
    )


async def send_payment_reminder(
    to_email: str,
    parent_name: str,
    family_name: str,
    amount_due: float,
    days_overdue: int = 0,
) -> Dict[str, Any]:
    """Send a payment reminder email."""
    urgency = "past due" if days_overdue > 0 else "upcoming"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">EPIC Prep Academy</h1>
            <p style="margin: 5px 0 0;">Payment Reminder</p>
        </div>
        <div style="padding: 20px;">
            <p>Hi {parent_name},</p>
            <p>This is a friendly reminder that the {family_name} account has a balance of <strong>${amount_due:.2f}</strong> {urgency}.</p>
            {"<p style='color: #dc2626;'>This payment is " + str(days_overdue) + " days overdue. Please submit payment at your earliest convenience.</p>" if days_overdue > 0 else ""}
            <p>Please log in to your parent portal to make a payment, or contact the front office for assistance.</p>
            <p>Thank you for choosing EPIC Prep Academy!</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            EPIC Prep Academy &mdash; Empowering Students Through Excellence
        </div>
    </div>
    """
    return await send_email(
        to_email=to_email,
        subject=f"Payment Reminder - {family_name} Account",
        html_content=html,
    )


async def send_permission_slip_reminder(
    to_email: str,
    parent_name: str,
    student_name: str,
    event_name: str,
    event_date: str,
    days_until: int,
) -> Dict[str, Any]:
    """Send a permission slip reminder email."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">EPIC Prep Academy</h1>
            <p style="margin: 5px 0 0;">Permission Slip Reminder</p>
        </div>
        <div style="padding: 20px;">
            <p>Hi {parent_name},</p>
            <p>{student_name} has an upcoming field trip that requires a signed permission slip:</p>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Event:</strong> {event_name}</p>
                <p style="margin: 5px 0 0;"><strong>Date:</strong> {event_date}</p>
                <p style="margin: 5px 0 0;"><strong>Days Until Event:</strong> {days_until}</p>
            </div>
            <p>Please log in to your parent portal to sign the permission slip, or contact the front office.</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            EPIC Prep Academy &mdash; Empowering Students Through Excellence
        </div>
    </div>
    """
    return await send_email(
        to_email=to_email,
        subject=f"Permission Slip Needed - {event_name} ({student_name})",
        html_content=html,
    )


async def send_document_reminder(
    to_email: str,
    parent_name: str,
    student_name: str,
    document_title: str,
    document_type: str,
) -> Dict[str, Any]:
    """Send a general document signing reminder email."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">EPIC Prep Academy</h1>
            <p style="margin: 5px 0 0;">Document Signing Reminder</p>
        </div>
        <div style="padding: 20px;">
            <p>Hi {parent_name},</p>
            <p>This is a friendly reminder that the following document requires your signature{' for ' + student_name if student_name else ''}:</p>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Document:</strong> {document_title}</p>
                <p style="margin: 5px 0 0;"><strong>Type:</strong> {document_type}</p>
            </div>
            <p>Please log in to your parent portal to review and sign this document, or contact the front office for assistance.</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            EPIC Prep Academy &mdash; Empowering Students Through Excellence
        </div>
    </div>
    """
    return await send_email(
        to_email=to_email,
        subject=f"Document Signing Reminder - {document_title}",
        html_content=html,
    )


async def send_enrollment_checklist_reminder(
    to_email: str,
    parent_name: str,
    child_name: str,
    pending_items: list,
) -> Dict[str, Any]:
    """Send an enrollment checklist completion reminder email."""
    items_html = "".join(f"<li>{item}</li>" for item in pending_items)
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">EPIC Prep Academy</h1>
            <p style="margin: 5px 0 0;">Enrollment Checklist Reminder</p>
        </div>
        <div style="padding: 20px;">
            <p>Hi {parent_name},</p>
            <p>This is a friendly reminder that {child_name}'s enrollment checklist has outstanding items that need to be completed:</p>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0 0 8px;"><strong>Pending Items:</strong></p>
                <ul style="margin: 0; padding-left: 20px;">{items_html}</ul>
            </div>
            <p>Please log in to your parent portal to complete the enrollment checklist, or contact the front office for assistance.</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            EPIC Prep Academy &mdash; Empowering Students Through Excellence
        </div>
    </div>
    """
    return await send_email(
        to_email=to_email,
        subject=f"Enrollment Checklist Reminder - {child_name}",
        html_content=html,
    )


async def send_incident_notification(
    to_email: str,
    parent_name: str,
    student_name: str,
    incident_type: str,
    severity: str,
    description: str,
    date_str: str,
) -> Dict[str, Any]:
    """Send an incident notification email to a parent."""
    severity_color = {"Low": "#22c55e", "Medium": "#f59e0b", "High": "#ef4444"}.get(severity, "#6b7280")
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">EPIC Prep Academy</h1>
            <p style="margin: 5px 0 0;">Incident Report Notification</p>
        </div>
        <div style="padding: 20px;">
            <p>Hi {parent_name},</p>
            <p>We are writing to inform you of an incident involving {student_name}:</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid {severity_color};">
                <p style="margin: 0;"><strong>Type:</strong> {incident_type}</p>
                <p style="margin: 5px 0 0;"><strong>Severity:</strong> <span style="color: {severity_color};">{severity}</span></p>
                <p style="margin: 5px 0 0;"><strong>Date:</strong> {date_str}</p>
                <p style="margin: 5px 0 0;"><strong>Details:</strong> {description}</p>
            </div>
            <p>If you have any questions or concerns, please contact the campus office.</p>
        </div>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            EPIC Prep Academy &mdash; Empowering Students Through Excellence
        </div>
    </div>
    """
    return await send_email(
        to_email=to_email,
        subject=f"Incident Report - {student_name} ({incident_type})",
        html_content=html,
    )
