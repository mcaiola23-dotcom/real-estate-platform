import logging
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Basic configuration
EMAIL_RECIPIENT = "Matt.HigginsGroup@gmail.com"
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "true").lower() == "true"
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

class EmailService:
    @staticmethod
    def send_lead_notification(lead_data: dict):
        """
        Send an email notification for a new lead.
        Currently prints to console if SMTP is not configured, matching local dev requirements.
        """
        subject = f"New Lead: {lead_data.get('name')} - {lead_data.get('intent', 'Inquiry')}"
        
        body = f"""
New Lead Received from SmartMLS AI Platform

Name: {lead_data.get('name')}
Email: {lead_data.get('email')}
Phone: {lead_data.get('phone') or 'N/A'}
Intent: {lead_data.get('intent', 'N/A')}

Property: {lead_data.get('property_address') or 'N/A'}
MLS ID: {lead_data.get('listing_id_str') or 'N/A'}
Parcel ID: {lead_data.get('parcel_id') or 'N/A'}

Message:
{lead_data.get('message', 'No message provided')}

Source: {lead_data.get('source', 'website')}
        """
        
        logger.info(f"Preparing to send email to {EMAIL_RECIPIENT}...")
        
        if not SMTP_USER or not SMTP_PASSWORD:
            # Local Dev Mode: Mock Send
            print("\n" + "="*60)
            print(f"MOCK EMAIL TO: {EMAIL_RECIPIENT}")
            print(f"SUBJECT: {subject}")
            print("-" * 60)
            print(body)
            print("="*60 + "\n")
            logger.info("Email mock sent to console.")
            return True
        
        # Real Send (Skeleton for when they add creds)
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart()
            msg['From'] = SMTP_USER
            msg['To'] = EMAIL_RECIPIENT
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USER, EMAIL_RECIPIENT, text)
            server.quit()
            logger.info("Email sent successfully via SMTP.")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
