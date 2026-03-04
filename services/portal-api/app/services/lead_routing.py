import logging
from .email import EmailService
from ..models.lead import Lead

logger = logging.getLogger(__name__)

class LeadRoutingService:
    @staticmethod
    def process_new_lead(lead: Lead):
        """
        Process a newly created lead.
        1. Log the lead.
        2. Send email notification.
        3. (Future) Post to CRM.
        """
        try:
            lead_data = {
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "message": lead.message,
                "source": lead.source,
                "intent": lead.intent,
                "property_address": lead.property_address,
                "listing_id_str": lead.listing_id_str,
                "parcel_id": lead.parcel_id
            }
            
            # Route to Email
            EmailService.send_lead_notification(lead_data)
            
            # Future: CRM Integration
            # CrmService.export_lead(lead_data)
            
        except Exception as e:
            logger.error(f"Error processing lead routing: {e}")
            # Don't raise, as lead is already saved in DB. 
            # We just want to ensure we don't break the response.
