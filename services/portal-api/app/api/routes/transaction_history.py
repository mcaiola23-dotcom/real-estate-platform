"""
Transaction history API endpoints.
Retrieves property sale history from CT GIS parcel data.
"""

from fastapi import APIRouter, HTTPException, Path
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from datetime import date

from app.core.config import settings

router = APIRouter(prefix="/api/properties", tags=["transaction_history"])


class TransactionEvent(BaseModel):
    """Single transaction event."""
    event_date: str
    event_type: str  # "sale", "listing", "price_change"
    price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    appreciation_pct: Optional[float] = None
    appreciation_amount: Optional[float] = None
    annualized_appreciation: Optional[float] = None
    years_held: Optional[float] = None


class TransactionHistory(BaseModel):
    """Complete transaction history for a property."""
    parcel_id: str
    property_address: str
    current_value: Optional[float] = None  # AVM or list price
    transactions: List[TransactionEvent]
    total_appreciation_pct: Optional[float] = None
    total_appreciation_amount: Optional[float] = None


@router.get("/{property_id}/transaction-history", response_model=TransactionHistory)
async def get_transaction_history(
    property_id: str = Path(..., description="Property ID (listing_id or parcel_id)")
):
    """
    Get transaction history for a property.
    
    Retrieves from transaction_history table (if available) or falls back to parcels table.
    Calculates appreciation between sales and annualized return.
    
    Returns timeline of events with appreciation calculations.
    """
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # First, find the parcel_id for this property
        is_listing_id = property_id.isdigit()
        
        if is_listing_id:
            # Query by listing_id
            parcel_query = text("""
                SELECT p.parcel_id, COALESCE(l.address_full, p.address_full) as address,
                       p.square_feet, avm.estimated_value, l.list_price
                FROM listings l
                LEFT JOIN parcels p ON l.parcel_id = p.parcel_id
                LEFT JOIN (
                    SELECT DISTINCT ON (parcel_id) parcel_id, estimated_value
                    FROM avm_valuations
                    ORDER BY parcel_id, valuation_date DESC
                ) avm ON p.parcel_id = avm.parcel_id
                WHERE l.listing_id = :property_id
                LIMIT 1
            """)
            result = conn.execute(parcel_query, {"property_id": int(property_id)})
        else:
            # Query by parcel_id
            parcel_query = text("""
                SELECT p.parcel_id, COALESCE(l.address_full, p.address_full) as address,
                       p.square_feet, avm.estimated_value, l.list_price
                FROM parcels p
                LEFT JOIN listings l ON p.parcel_id = l.parcel_id AND l.status = 'Active'
                LEFT JOIN (
                    SELECT DISTINCT ON (parcel_id) parcel_id, estimated_value
                    FROM avm_valuations
                    ORDER BY parcel_id, valuation_date DESC
                ) avm ON p.parcel_id = avm.parcel_id
                WHERE p.parcel_id = :property_id
                LIMIT 1
            """)
            result = conn.execute(parcel_query, {"property_id": property_id})
        
        row = result.fetchone()
        if not row:
            # Property not in DB — return empty history instead of 404
            return TransactionHistory(
                parcel_id=property_id,
                property_address="",
                current_value=None,
                transactions=[],
                total_appreciation_pct=None,
                total_appreciation_amount=None
            )

        parcel_id = row[0] or property_id
        address = row[1] or ""
        square_feet = row[2]
        avm_value = float(row[3]) if row[3] else None
        list_price = float(row[4]) if row[4] else None
        current_value = list_price or avm_value
        
        # Try to get transactions from transaction_history table first
        transaction_query = text("""
            SELECT event_date, event_type, price
            FROM transaction_history
            WHERE parcel_id = :parcel_id AND event_type = 'sale'
            ORDER BY event_date ASC
        """)
        
        result = conn.execute(transaction_query, {"parcel_id": parcel_id})
        transaction_rows = result.fetchall()
        
        transactions = []
        
        if transaction_rows:
            # Use transaction_history table data
            prev_price = None
            prev_date = None
            
            for row in transaction_rows:
                event_date = row[0]
                price = float(row[2]) if row[2] else None
                
                if not price:
                    continue
                
                price_per_sqft = None
                if square_feet and price:
                    price_per_sqft = price / square_feet
                
                appreciation_pct = None
                appreciation_amount = None
                annualized_appreciation = None
                years_held = None
                
                # Calculate appreciation from previous sale
                if prev_price and prev_date:
                    appreciation_amount = price - prev_price
                    appreciation_pct = (appreciation_amount / prev_price) * 100
                    
                    days_held = (event_date - prev_date).days
                    years_held = days_held / 365.25
                    
                    if years_held > 0:
                        annualized_appreciation = ((price / prev_price) ** (1 / years_held) - 1) * 100
                
                transactions.append(TransactionEvent(
                    event_date=event_date.isoformat(),
                    event_type="sale",
                    price=price,
                    price_per_sqft=price_per_sqft,
                    appreciation_pct=appreciation_pct,
                    appreciation_amount=appreciation_amount,
                    annualized_appreciation=annualized_appreciation,
                    years_held=years_held
                ))
                
                prev_price = price
                prev_date = event_date
        else:
            # Fallback to parcels table (last_sale and prior_sale)
            fallback_query = text("""
                SELECT last_sale_price, last_sale_date, prior_sale_price, prior_sale_date
                FROM parcels
                WHERE parcel_id = :parcel_id
            """)
            result = conn.execute(fallback_query, {"parcel_id": parcel_id})
            row = result.fetchone()
            
            if row:
                last_sale_price = float(row[0]) if row[0] else None
                last_sale_date = row[1]
                prior_sale_price = float(row[2]) if row[2] else None
                prior_sale_date = row[3]
                
                # Add prior sale (oldest first)
                if prior_sale_price and prior_sale_date:
                    price_per_sqft = None
                    if square_feet:
                        price_per_sqft = prior_sale_price / square_feet
                    
                    transactions.append(TransactionEvent(
                        event_date=prior_sale_date.isoformat(),
                        event_type="sale",
                        price=prior_sale_price,
                        price_per_sqft=price_per_sqft
                    ))
                
                # Add last sale with appreciation
                if last_sale_price and last_sale_date:
                    price_per_sqft = None
                    if square_feet:
                        price_per_sqft = last_sale_price / square_feet
                    
                    appreciation_pct = None
                    appreciation_amount = None
                    annualized_appreciation = None
                    years_held = None
                    
                    if prior_sale_price and prior_sale_date:
                        appreciation_amount = last_sale_price - prior_sale_price
                        appreciation_pct = (appreciation_amount / prior_sale_price) * 100
                        
                        days_held = (last_sale_date - prior_sale_date).days
                        years_held = days_held / 365.25
                        
                        if years_held > 0:
                            annualized_appreciation = ((last_sale_price / prior_sale_price) ** (1 / years_held) - 1) * 100
                    
                    transactions.append(TransactionEvent(
                        event_date=last_sale_date.isoformat(),
                        event_type="sale",
                        price=last_sale_price,
                        price_per_sqft=price_per_sqft,
                        appreciation_pct=appreciation_pct,
                        appreciation_amount=appreciation_amount,
                        annualized_appreciation=annualized_appreciation,
                        years_held=years_held
                    ))
        
        # Calculate total appreciation to current value
        total_appreciation_pct = None
        total_appreciation_amount = None
        
        if current_value and transactions:
            last_transaction = transactions[-1]
            if last_transaction.price:
                total_appreciation_amount = current_value - last_transaction.price
                total_appreciation_pct = (total_appreciation_amount / last_transaction.price) * 100
        
        return TransactionHistory(
            parcel_id=parcel_id,
            property_address=address,
            current_value=current_value,
            transactions=transactions,
            total_appreciation_pct=total_appreciation_pct,
            total_appreciation_amount=total_appreciation_amount
        )

