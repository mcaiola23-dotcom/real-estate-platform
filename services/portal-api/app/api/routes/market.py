"""Market statistics API — town and neighborhood level aggregates.

Data source strategy:
  - Phase 1 (current): Aggregate from our own listings table
  - Phase 2 (future): ATTOM API or similar for broader market data
  - Phase 3 (future): Direct MLS/IDX feed integration

The frontend consumes a stable JSON contract regardless of backend data source.
The `source` field indicates provenance so the UI can attribute accordingly.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...core.logging import get_logger
from ...db import get_db
from ...models.listing import Listing

router = APIRouter(prefix="/api/market", tags=["market"])
logger = get_logger(__name__)


def _decimal_to_float(value: Optional[Decimal]) -> Optional[float]:
    if value is None:
        return None
    return float(value)


def _compute_stats(db: Session, filters: list) -> dict:
    """Compute market statistics for a set of listing filters."""
    cutoff = date.today() - timedelta(days=365)

    # Sold stats (last 12 months)
    sold_base = (
        db.query(Listing)
        .filter(Listing.status == "Sold")
        .filter(Listing.sold_date >= cutoff)
    )
    for f in filters:
        sold_base = sold_base.filter(f)

    sold_stats = sold_base.with_entities(
        func.count(Listing.listing_id).label("total_sales"),
        func.avg(Listing.sold_price).label("avg_sale_price"),
        func.avg(Listing.days_on_market).label("avg_dom"),
    ).first()

    # Median sale price — use all sold prices, sort, pick middle
    sold_prices = [
        float(row.sold_price)
        for row in sold_base.with_entities(Listing.sold_price)
        .filter(Listing.sold_price.isnot(None))
        .order_by(Listing.sold_price)
        .all()
    ]
    median_sale_price = None
    if sold_prices:
        mid = len(sold_prices) // 2
        median_sale_price = (
            sold_prices[mid]
            if len(sold_prices) % 2 == 1
            else (sold_prices[mid - 1] + sold_prices[mid]) / 2
        )

    # Median DOM
    dom_values = [
        row.days_on_market
        for row in sold_base.with_entities(Listing.days_on_market)
        .filter(Listing.days_on_market.isnot(None))
        .order_by(Listing.days_on_market)
        .all()
    ]
    median_dom = None
    if dom_values:
        mid = len(dom_values) // 2
        median_dom = (
            dom_values[mid]
            if len(dom_values) % 2 == 1
            else (dom_values[mid - 1] + dom_values[mid]) // 2
        )

    # Average price per sqft (sold, where sqft > 0)
    ppsf_rows = sold_base.with_entities(
        Listing.sold_price, Listing.square_feet
    ).filter(
        Listing.sold_price.isnot(None),
        Listing.square_feet.isnot(None),
        Listing.square_feet > 0,
    ).all()
    avg_price_per_sqft = None
    if ppsf_rows:
        total_ppsf = sum(float(r.sold_price) / r.square_feet for r in ppsf_rows)
        avg_price_per_sqft = round(total_ppsf / len(ppsf_rows))

    # Active inventory count
    active_base = db.query(Listing).filter(Listing.status == "Active")
    for f in filters:
        active_base = active_base.filter(f)
    inventory_count = active_base.count()

    # YoY price trend — compare median of last 6 months vs prior 6 months
    six_months_ago = date.today() - timedelta(days=182)
    recent_prices = [
        float(row.sold_price)
        for row in sold_base.with_entities(Listing.sold_price)
        .filter(Listing.sold_price.isnot(None), Listing.sold_date >= six_months_ago)
        .all()
    ]
    older_prices = [
        float(row.sold_price)
        for row in sold_base.with_entities(Listing.sold_price)
        .filter(Listing.sold_price.isnot(None), Listing.sold_date < six_months_ago)
        .all()
    ]
    price_trend_yoy = None
    if recent_prices and older_prices:
        recent_median = sorted(recent_prices)[len(recent_prices) // 2]
        older_median = sorted(older_prices)[len(older_prices) // 2]
        if older_median > 0:
            price_trend_yoy = round((recent_median - older_median) / older_median, 3)

    return {
        "median_sale_price": round(median_sale_price) if median_sale_price else None,
        "avg_sale_price": round(_decimal_to_float(sold_stats.avg_sale_price)) if sold_stats.avg_sale_price else None,
        "total_sales_12m": sold_stats.total_sales or 0,
        "median_dom": median_dom,
        "avg_price_per_sqft": avg_price_per_sqft,
        "inventory_count": inventory_count,
        "price_trend_yoy": price_trend_yoy,
    }


@router.get("/stats")
async def get_market_stats(
    town: str = Query(..., description="Town/city name"),
    neighborhood: Optional[str] = Query(None, description="Neighborhood name (optional)"),
    db: Session = Depends(get_db),
):
    """Return market statistics for a town and optionally a neighborhood."""

    # Town-level stats
    town_filters = [Listing.city.ilike(town)]
    town_stats = _compute_stats(db, town_filters)
    town_stats["name"] = town

    # Neighborhood-level stats (if provided)
    neighborhood_stats = None
    if neighborhood:
        # Neighborhood filtering: check mls_area_minor, subdivision, mls_area, market_area
        neighborhood_filters = [
            Listing.city.ilike(town),
            (
                Listing.mls_area_minor.ilike(f"%{neighborhood}%")
                | Listing.subdivision.ilike(f"%{neighborhood}%")
                | Listing.mls_area.ilike(f"%{neighborhood}%")
                | Listing.market_area.ilike(f"%{neighborhood}%")
            ),
        ]
        neighborhood_stats = _compute_stats(db, neighborhood_filters)

        # Fallback: if no results, try partial match (first two words)
        if (
            neighborhood_stats.get("total_sales_12m", 0) == 0
            and neighborhood_stats.get("inventory_count", 0) == 0
        ):
            words = neighborhood.split()
            if len(words) > 2:
                partial = " ".join(words[:2])
                partial_filters = [
                    Listing.city.ilike(town),
                    (
                        Listing.mls_area_minor.ilike(f"%{partial}%")
                        | Listing.subdivision.ilike(f"%{partial}%")
                        | Listing.mls_area.ilike(f"%{partial}%")
                        | Listing.market_area.ilike(f"%{partial}%")
                    ),
                ]
                partial_stats = _compute_stats(db, partial_filters)
                if (
                    partial_stats.get("total_sales_12m", 0) > 0
                    or partial_stats.get("inventory_count", 0) > 0
                ):
                    neighborhood_stats = partial_stats

        # Only return neighborhood stats if they have data
        if (
            neighborhood_stats.get("total_sales_12m", 0) > 0
            or neighborhood_stats.get("inventory_count", 0) > 0
        ):
            neighborhood_stats["name"] = neighborhood
        else:
            neighborhood_stats = None

    return {
        "town": town_stats,
        "neighborhood": neighborhood_stats,
        "source": "internal",
        "as_of": date.today().isoformat(),
    }
