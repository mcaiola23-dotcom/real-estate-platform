"""
Email service stub for search alerts.
In production, this would integrate with SendGrid, SES, or similar.
For now, it just logs emails instead of sending them.
"""

import logging
from typing import List, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class EmailRecipient(BaseModel):
    email: str
    name: Optional[str] = None


class AlertEmailData(BaseModel):
    recipient: EmailRecipient
    search_name: str
    new_listings_count: int
    listing_summaries: List[dict]  # [{address, price, beds, baths, photo_url}]
    search_url: str


def send_alert_email(
    user_email: str,
    user_name: Optional[str],
    subject: str,
    html_content: str
) -> bool:
    """
    Send an email to a user.
    
    STUB: Logs the email instead of actually sending it.
    In production, replace with actual email service (SendGrid, SES, etc.)
    
    Returns True if "sent" successfully (for stub, always returns True).
    """
    logger.info(
        f"[EMAIL STUB] Sending email:\n"
        f"  To: {user_name or 'User'} <{user_email}>\n"
        f"  Subject: {subject}\n"
        f"  HTML Content Length: {len(html_content)} chars"
    )
    
    # Log first 500 chars of content for debugging
    preview = html_content[:500] + "..." if len(html_content) > 500 else html_content
    logger.debug(f"[EMAIL STUB] Content preview:\n{preview}")
    
    return True


def send_search_alert(data: AlertEmailData) -> bool:
    """
    Send a search alert email to a user.
    
    STUB: Logs the alert details instead of sending an actual email.
    """
    subject = f"🏠 {data.new_listings_count} new listings for \"{data.search_name}\""
    
    # Build simple HTML content
    listings_html = ""
    for listing in data.listing_summaries[:5]:  # Max 5 in preview
        listings_html += f"""
        <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <strong>{listing.get('address', 'Address N/A')}</strong><br>
            ${listing.get('price', 'N/A'):,} | {listing.get('beds', '?')} bed | {listing.get('baths', '?')} bath
        </div>
        """
    
    html_content = f"""
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">{data.new_listings_count} New Listings Match Your Search</h2>
        <p>We found new properties matching your saved search: <strong>{data.search_name}</strong></p>
        
        <div style="margin: 24px 0;">
            {listings_html}
        </div>
        
        <a href="{data.search_url}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600;">
            View All {data.new_listings_count} Listings
        </a>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
            You're receiving this because you set up a search alert on SmartMLS.
            <a href="#">Manage your alerts</a>
        </p>
    </body>
    </html>
    """
    
    return send_alert_email(
        user_email=data.recipient.email,
        user_name=data.recipient.name,
        subject=subject,
        html_content=html_content
    )


def send_welcome_email(user_email: str, user_name: Optional[str] = None) -> bool:
    """Send a welcome email to a new user."""
    subject = "Welcome to SmartMLS! 🏠"
    html_content = f"""
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Welcome to SmartMLS!</h1>
        <p>Hi {user_name or 'there'},</p>
        <p>Thanks for joining SmartMLS. Here's what you can do:</p>
        <ul>
            <li>🔍 Search properties with AI-powered natural language</li>
            <li>❤️ Save your favorite listings</li>
            <li>🔔 Set up alerts for new listings</li>
            <li>📍 Save locations to see commute times</li>
        </ul>
        <a href="https://smartmls.com/properties" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600;">
            Start Searching
        </a>
    </body>
    </html>
    """
    return send_alert_email(user_email, user_name, subject, html_content)
