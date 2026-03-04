"""
Mortgage rates and financing calculator API endpoints.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

router = APIRouter(prefix="/api/mortgage", tags=["mortgage"])

# Simple in-memory cache for rates (refreshed daily)
_rate_cache = {
    'rates': None,
    'cached_date': None
}


class MortgageRates(BaseModel):
    """Current mortgage rates."""
    rate_30yr: float
    rate_15yr: float
    rate_20yr: Optional[float] = None
    updated_at: str


class PaymentCalculationRequest(BaseModel):
    """Request for mortgage payment calculation."""
    home_price: float
    down_payment: float
    interest_rate: float
    loan_term_years: int
    property_tax_annual: Optional[float] = None
    hoa_monthly: Optional[float] = None
    homeowners_insurance_annual: Optional[float] = None


class PaymentBreakdown(BaseModel):
    """Detailed mortgage payment breakdown."""
    principal_and_interest: float
    property_tax_monthly: float
    homeowners_insurance_monthly: float
    hoa_monthly: float
    pmi_monthly: float
    total_monthly_payment: float
    loan_amount: float
    down_payment_amount: float
    down_payment_percent: float


def get_current_rates_from_source() -> MortgageRates:
    """
    Get current rates from external source (Freddie Mac API or other).
    For now, returns typical current market rates.
    
    TODO: Integrate with actual API:
    - Freddie Mac Primary Mortgage Market Survey (free)
    - Mortgage News Daily API
    - Update .env with API key if needed
    """
    # Placeholder rates (typical as of Q4 2024)
    # In production, fetch from actual API
    return MortgageRates(
        rate_30yr=6.875,
        rate_15yr=6.125,
        rate_20yr=6.500,
        updated_at=datetime.now().isoformat()
    )


@router.get("/rates/current", response_model=MortgageRates)
async def get_current_mortgage_rates():
    """
    Get current mortgage rates with daily caching.
    
    Returns 30-year and 15-year fixed rates.
    Rates are cached for the day to minimize API calls.
    """
    today = date.today()
    
    # Check cache
    if _rate_cache['cached_date'] == today and _rate_cache['rates']:
        return _rate_cache['rates']
    
    # Fetch fresh rates
    rates = get_current_rates_from_source()
    
    # Update cache
    _rate_cache['rates'] = rates
    _rate_cache['cached_date'] = today
    
    return rates


@router.post("/calculate-payment", response_model=PaymentBreakdown)
async def calculate_monthly_payment(request: PaymentCalculationRequest):
    """
    Calculate detailed monthly mortgage payment breakdown.
    
    Includes:
    - Principal & Interest
    - Property Tax
    - Homeowners Insurance
    - HOA Fees
    - PMI (if down payment < 20%)
    """
    # Calculate loan amount and down payment
    down_payment_amount = request.home_price * (request.down_payment / 100)
    loan_amount = request.home_price - down_payment_amount
    down_payment_percent = request.down_payment
    
    # Calculate monthly principal & interest
    monthly_rate = request.interest_rate / 100 / 12
    num_payments = request.loan_term_years * 12
    
    if monthly_rate > 0:
        principal_and_interest = loan_amount * (
            monthly_rate * (1 + monthly_rate) ** num_payments
        ) / ((1 + monthly_rate) ** num_payments - 1)
    else:
        # Edge case: 0% interest
        principal_and_interest = loan_amount / num_payments
    
    # Calculate property tax monthly
    property_tax_monthly = 0
    if request.property_tax_annual:
        property_tax_monthly = request.property_tax_annual / 12
    
    # Calculate homeowners insurance monthly
    homeowners_insurance_monthly = 0
    if request.homeowners_insurance_annual:
        homeowners_insurance_monthly = request.homeowners_insurance_annual / 12
    else:
        # Estimate: 0.15% of home value annually
        homeowners_insurance_monthly = (request.home_price * 0.0015) / 12
    
    # HOA fees
    hoa_monthly = request.hoa_monthly or 0
    
    # PMI (if down payment < 20%)
    pmi_monthly = 0
    if down_payment_percent < 20:
        # Typical PMI: 0.5% of loan amount annually
        pmi_monthly = (loan_amount * 0.005) / 12
    
    # Total monthly payment
    total_monthly_payment = (
        principal_and_interest +
        property_tax_monthly +
        homeowners_insurance_monthly +
        hoa_monthly +
        pmi_monthly
    )
    
    return PaymentBreakdown(
        principal_and_interest=round(principal_and_interest, 2),
        property_tax_monthly=round(property_tax_monthly, 2),
        homeowners_insurance_monthly=round(homeowners_insurance_monthly, 2),
        hoa_monthly=round(hoa_monthly, 2),
        pmi_monthly=round(pmi_monthly, 2),
        total_monthly_payment=round(total_monthly_payment, 2),
        loan_amount=round(loan_amount, 2),
        down_payment_amount=round(down_payment_amount, 2),
        down_payment_percent=down_payment_percent
    )


