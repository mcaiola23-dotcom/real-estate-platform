from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...db import get_db
from ...models.lead import Lead
from ...models.user import User
from ...core.auth import get_current_user
from ..schemas import LeadCreate, LeadResponse, LeadSubmissionResponse

router = APIRouter(prefix="/leads", tags=["leads"])


from ...services.lead_routing import LeadRoutingService

ALLOWED_LEAD_READ_USER_TYPES = {"admin", "agent"}


def require_lead_read_access(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require lead read scope for admin/agent users."""
    user_type = (current_user.user_type or "").strip().lower()
    if user_type not in ALLOWED_LEAD_READ_USER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Lead access requires an admin or agent account",
        )
    return current_user

@router.post("/", response_model=LeadSubmissionResponse)
async def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    """Create a new lead."""
    
    # Create lead instance
    lead = Lead(
        name=lead_data.name,
        email=lead_data.email,
        phone=lead_data.phone,
        message=lead_data.message,
        source=lead_data.source or "website",
        interested_property_id=lead_data.interested_property_id,
        property_address=lead_data.property_address,
        parcel_id=lead_data.parcel_id,
        listing_id_str=lead_data.listing_id_str,
        intent=lead_data.intent,
        meta_data=lead_data.meta_data,
        status="new",
        lead_score=0
    )
    
    # Save to database
    db.add(lead)
    db.commit()
    db.refresh(lead)
    
    # Trigger routing (email, CRM)
    # Run synchronously for now to ensure delivery before response, or background task
    # For Phase 0 critical leads, synchronous is safer unless high volume.
    LeadRoutingService.process_new_lead(lead)
    
    return LeadSubmissionResponse(status="received")


@router.get("/", response_model=List[LeadResponse])
async def get_leads(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_lead_read_access),
):
    """Get all leads (admin endpoint)."""
    leads = db.query(Lead).filter(Lead.is_active == True).offset(skip).limit(limit).all()
    return leads


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_lead_read_access),
):
    """Get a specific lead by ID."""
    lead = db.query(Lead).filter(
        Lead.id == lead_id,
        Lead.is_active == True
    ).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return lead


