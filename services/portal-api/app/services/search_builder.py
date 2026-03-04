"""
Search Query Builder Service

Converts AI-parsed search filters into SQLAlchemy queries.
Handles fuzzy term translation, relevance scoring, and efficient query construction.
"""

import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from decimal import Decimal
from sqlalchemy import and_, or_, func, case, text, literal_column
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import label

from ..models.parcel import Parcel
from ..models.listing import Listing
from ..avm.models import AvmValuation
from ..api.schemas import ParsedSearchFilters

# Configure logging
logger = logging.getLogger(__name__)


class SearchQueryBuilder:
    """
    Builds SQLAlchemy queries from AI-parsed search filters.
    
    Features:
    - Joins Parcels, Listings, and AVM valuations
    - Handles fuzzy terms via market percentiles
    - Computes relevance scores
    - Efficient query construction with proper indexing
    """
    
    # Property type mapping for flexible matching (outputs database format)
    PROPERTY_TYPE_MAP = {
        "single family": ["Single Family", "SingleFamily"],
        "singlefamily": ["Single Family", "SingleFamily"],
        "house": ["Single Family", "SingleFamily"],
        "home": ["Single Family", "SingleFamily"],
        "condo": ["Condo"],
        "condominium": ["Condo"],
        "townhouse": ["Townhouse"],
        "townhome": ["Townhouse"],
        "multi-family": ["Multi-Family", "MultiFamily"],
        "multifamily": ["Multi-Family", "MultiFamily"],
        "multi family": ["Multi-Family", "MultiFamily"],
        "duplex": ["Multi-Family", "MultiFamily"],
        "land": ["Land"],
        "lot": ["Land"],
        "commercial": ["Commercial"],
    }
    
    # Feature keyword mapping
    FEATURE_KEYWORDS = {
        "pool": ["pool"],
        "garage": ["garage"],
        "waterfront": ["waterfront", "water", "water views", "lake", "ocean", "beach", "river"],
        "fireplace": ["fireplace"],
        "basement": ["basement"],
        "central air": ["central air", "a/c", "ac", "air conditioning"],
        "hardwood": ["hardwood", "hardwood floors"],
        "updated kitchen": ["updated kitchen", "renovated kitchen", "modern kitchen"],
        "new construction": ["new construction", "newly built", "new build"],
    }
    
    def __init__(self, db: Session):
        """Initialize the query builder with a database session."""
        self.db = db
        self._market_stats_cache = None
    
    def _get_market_stats(self) -> Dict[str, Any]:
        """
        Get market statistics for fuzzy term translation.
        
        Computes percentiles for price, sqft to translate terms like:
        - "affordable" -> bottom 33%
        - "luxury" -> top 20%
        - "spacious" -> above median sqft
        """
        if self._market_stats_cache:
            return self._market_stats_cache
        
        try:
            # Get price percentiles from listings and AVM
            stats_query = text("""
                WITH prices AS (
                    SELECT COALESCE(l.list_price, av.estimated_value) as price,
                           COALESCE(l.square_feet, p.square_feet) as sqft,
                           COALESCE(p.year_built, l.year_built) as year_built
                    FROM parcels p
                    LEFT JOIN listings l ON l.parcel_id = p.parcel_id AND l.status = 'Active'
                    LEFT JOIN avm_valuations av ON av.parcel_id = p.parcel_id
                    WHERE p.property_type IN ('Single Family', 'Condo', 'Townhouse', 'Multi-Family')
                      AND (l.list_price IS NOT NULL OR av.estimated_value IS NOT NULL)
                )
                SELECT 
                    percentile_cont(0.33) WITHIN GROUP (ORDER BY price) as price_p33,
                    percentile_cont(0.50) WITHIN GROUP (ORDER BY price) as price_p50,
                    percentile_cont(0.80) WITHIN GROUP (ORDER BY price) as price_p80,
                    percentile_cont(0.50) WITHIN GROUP (ORDER BY sqft) as sqft_median,
                    percentile_cont(0.75) WITHIN GROUP (ORDER BY sqft) as sqft_p75
                FROM prices
                WHERE price > 0 AND sqft > 0
            """)
            
            result = self.db.execute(stats_query).fetchone()
            
            if result:
                self._market_stats_cache = {
                    "price_affordable": float(result[0]) if result[0] else 400000,  # 33rd percentile
                    "price_median": float(result[1]) if result[1] else 600000,      # 50th percentile
                    "price_luxury": float(result[2]) if result[2] else 1200000,     # 80th percentile
                    "sqft_median": int(result[3]) if result[3] else 2000,           # Median sqft
                    "sqft_spacious": int(result[4]) if result[4] else 3000,         # 75th percentile
                }
            else:
                # Fallback defaults for Fairfield County
                self._market_stats_cache = {
                    "price_affordable": 400000,
                    "price_median": 600000,
                    "price_luxury": 1200000,
                    "sqft_median": 2000,
                    "sqft_spacious": 3000,
                }
            
            logger.info(f"[SearchQueryBuilder] Market stats: {self._market_stats_cache}")
            return self._market_stats_cache
            
        except Exception as e:
            logger.error(f"[SearchQueryBuilder] Error getting market stats: {e}")
            # Return sensible defaults
            return {
                "price_affordable": 400000,
                "price_median": 600000,
                "price_luxury": 1200000,
                "sqft_median": 2000,
                "sqft_spacious": 3000,
            }
    
    def _normalize_property_type(self, type_str: str) -> List[str]:
        """Normalize property type string to database formats (returns list to handle both formats)."""
        normalized = self.PROPERTY_TYPE_MAP.get(type_str.lower().strip())
        if normalized:
            return normalized
        # Try fuzzy matching
        for key, values in self.PROPERTY_TYPE_MAP.items():
            if key in type_str.lower():
                return values
        return [type_str]  # Return as-is if no match
    
    def _apply_fuzzy_terms(self, filters: ParsedSearchFilters) -> ParsedSearchFilters:
        """
        Translate fuzzy terms to concrete filter values.
        
        Modifies the filters in-place based on fuzzy terms.
        """
        if not filters.fuzzy_terms:
            return filters
        
        market_stats = self._get_market_stats()
        
        for term in filters.fuzzy_terms:
            term_lower = term.lower()
            
            if "affordable" in term_lower or "budget" in term_lower:
                # Set max price to 33rd percentile if not already set
                if filters.price_max is None or filters.price_max > market_stats["price_affordable"]:
                    filters.price_max = int(market_stats["price_affordable"])
                    logger.info(f"[SearchQueryBuilder] Applied 'affordable': price_max=${filters.price_max:,}")
            
            elif "luxury" in term_lower or "high-end" in term_lower or "premium" in term_lower:
                # Set min price to 80th percentile
                if filters.price_min is None or filters.price_min < market_stats["price_luxury"]:
                    filters.price_min = int(market_stats["price_luxury"])
                    logger.info(f"[SearchQueryBuilder] Applied 'luxury': price_min=${filters.price_min:,}")
            
            elif "spacious" in term_lower or "large" in term_lower:
                # Set min sqft to 75th percentile
                if filters.square_feet_min is None or filters.square_feet_min < market_stats["sqft_spacious"]:
                    filters.square_feet_min = market_stats["sqft_spacious"]
                    logger.info(f"[SearchQueryBuilder] Applied 'spacious': sqft_min={filters.square_feet_min:,}")
            
            elif "fixer" in term_lower or "handyman" in term_lower or "needs work" in term_lower:
                # Older homes, lower price range
                if filters.year_built_max is None:
                    filters.year_built_max = 1980
                if filters.price_max is None:
                    filters.price_max = int(market_stats["price_affordable"])
                logger.info(f"[SearchQueryBuilder] Applied 'fixer-upper': year_built_max=1980, price_max=${filters.price_max:,}")
            
            elif "move-in ready" in term_lower or "updated" in term_lower or "turnkey" in term_lower:
                # Newer or recently updated
                if filters.year_built_min is None:
                    filters.year_built_min = 1990
                logger.info(f"[SearchQueryBuilder] Applied 'move-in ready': year_built_min=1990")
            
            elif "family" in term_lower or "kids" in term_lower:
                # Assume 3+ bedrooms for families
                if filters.bedrooms_min is None or filters.bedrooms_min < 3:
                    filters.bedrooms_min = 3
                logger.info(f"[SearchQueryBuilder] Applied 'family-friendly': bedrooms_min=3")
        
        return filters
    
    def build_query(
        self,
        filters: ParsedSearchFilters,
        include_off_market: bool = False,
        page: int = 1,
        page_size: int = 25
    ) -> Tuple[Any, int]:
        """
        Build a SQLAlchemy query from parsed filters.
        
        Args:
            filters: Parsed search filters from AI
            include_off_market: Include properties without active listings (uses AVM).
                               Default is False - only shows Active and Pending listings.
            page: Page number (1-indexed)
            page_size: Results per page
            
        Returns:
            Tuple of (query results, total count)
        """
        start_time = datetime.now()
        
        # Apply fuzzy term translations
        filters = self._apply_fuzzy_terms(filters)
        
        # Build base query with all necessary joins
        # We need parcels, joined to listings (Active OR Pending) and optionally AVM
        query = self.db.query(
            Parcel.parcel_id,
            Parcel.address_full.label("address"),
            Parcel.city,
            Parcel.state,
            Parcel.zip_code,
            Parcel.bedrooms,
            Parcel.bathrooms,
            Parcel.square_feet,
            Parcel.lot_size_acres,
            Parcel.year_built,
            Parcel.property_type,
            func.ST_Y(Parcel.centroid).label("latitude"),
            func.ST_X(Parcel.centroid).label("longitude"),
            Listing.listing_id,
            Listing.list_price,
            Listing.status.label("listing_status"),
            Listing.photos,
            AvmValuation.estimated_value.label("avm_estimate"),
            # Computed price: prefer listing price, fall back to AVM
            func.coalesce(Listing.list_price, AvmValuation.estimated_value).label("effective_price"),
        ).outerjoin(
            Listing, 
            and_(
                Listing.parcel_id == Parcel.parcel_id,
                Listing.status.in_(['Active', 'Pending'])  # Include both Active and Pending
            )
        ).outerjoin(
            AvmValuation,
            AvmValuation.parcel_id == Parcel.parcel_id
        )
        
        # Build filter conditions
        conditions = []
        
        # Only include residential properties - handle both formats (with and without space)
        conditions.append(
            Parcel.property_type.in_([
                'Single Family', 'SingleFamily',
                'Condo', 
                'Townhouse', 
                'Multi-Family', 'MultiFamily'
            ])
        )
        
        # Price filters - use effective price (listing or AVM)
        if filters.price_min:
            conditions.append(
                func.coalesce(Listing.list_price, AvmValuation.estimated_value) >= filters.price_min
            )
        
        if filters.price_max:
            conditions.append(
                func.coalesce(Listing.list_price, AvmValuation.estimated_value) <= filters.price_max
            )
        
        # Bedroom filters
        if filters.bedrooms_min:
            conditions.append(
                func.coalesce(Listing.bedrooms, Parcel.bedrooms) >= filters.bedrooms_min
            )
        
        if filters.bedrooms_max:
            conditions.append(
                func.coalesce(Listing.bedrooms, Parcel.bedrooms) <= filters.bedrooms_max
            )
        
        # Bathroom filters
        if filters.bathrooms_min:
            conditions.append(
                func.coalesce(Listing.bathrooms, Parcel.bathrooms) >= filters.bathrooms_min
            )
        
        if filters.bathrooms_max:
            conditions.append(
                func.coalesce(Listing.bathrooms, Parcel.bathrooms) <= filters.bathrooms_max
            )
        
        # Square feet filters
        if filters.square_feet_min:
            conditions.append(
                func.coalesce(Listing.square_feet, Parcel.square_feet) >= filters.square_feet_min
            )
        
        if filters.square_feet_max:
            conditions.append(
                func.coalesce(Listing.square_feet, Parcel.square_feet) <= filters.square_feet_max
            )
        
        # Lot size filters
        if filters.lot_acres_min:
            conditions.append(Parcel.lot_size_acres >= filters.lot_acres_min)
        
        if filters.lot_acres_max:
            conditions.append(Parcel.lot_size_acres <= filters.lot_acres_max)
        
        # Year built filters
        if filters.year_built_min:
            conditions.append(
                func.coalesce(Listing.year_built, Parcel.year_built) >= filters.year_built_min
            )
        
        if filters.year_built_max:
            conditions.append(
                func.coalesce(Listing.year_built, Parcel.year_built) <= filters.year_built_max
            )
        
        # Property type filters
        if filters.property_types:
            # Normalize and flatten all type variations
            normalized_types = []
            for t in filters.property_types:
                normalized_types.extend(self._normalize_property_type(t))
            conditions.append(Parcel.property_type.in_(normalized_types))
        
        # City/town filters
        if filters.cities:
            # Normalize city names (case-insensitive matching)
            city_conditions = []
            for city in filters.cities:
                city_conditions.append(func.lower(Parcel.city) == city.lower())
            conditions.append(or_(*city_conditions))
        
        # ZIP code filters
        if filters.zip_codes:
            conditions.append(Parcel.zip_code.in_(filters.zip_codes))
        
        # Feature filters (search in listing description and features)
        if filters.features:
            feature_conditions = []
            for feature in filters.features:
                feature_lower = feature.lower()
                
                # Check for pool
                if "pool" in feature_lower:
                    feature_conditions.append(
                        or_(
                            Listing.pool.isnot(None),
                            Listing.pool != '',
                            func.lower(Listing.exterior_features).contains('pool')
                        )
                    )
                
                # Check for waterfront/water views
                elif any(w in feature_lower for w in ["water", "waterfront", "ocean", "lake", "beach"]):
                    feature_conditions.append(
                        or_(
                            func.lower(Listing.view).contains('water'),
                            func.lower(Listing.lot_description).contains('water'),
                            func.lower(Listing.public_remarks).contains('waterfront'),
                            func.lower(Listing.public_remarks).contains('water view')
                        )
                    )
                
                # Check for garage
                elif "garage" in feature_lower:
                    feature_conditions.append(
                        or_(
                            Listing.garage_spaces > 0,
                            func.lower(Listing.parking_description).contains('garage')
                        )
                    )
                
                # Check for fireplace
                elif "fireplace" in feature_lower:
                    feature_conditions.append(
                        or_(
                            Listing.fireplaces > 0,
                            func.lower(Listing.interior_features).contains('fireplace')
                        )
                    )
                
                # Generic feature search in remarks
                else:
                    feature_conditions.append(
                        func.lower(Listing.public_remarks).contains(feature_lower)
                    )
            
            if feature_conditions:
                conditions.append(and_(*feature_conditions))
        
        # If not including off-market, require active or pending listing
        if not include_off_market:
            conditions.append(Listing.listing_id.isnot(None))
        else:
            # Must have either listing or AVM
            conditions.append(
                or_(
                    Listing.listing_id.isnot(None),
                    AvmValuation.id.isnot(None)
                )
            )
        
        # Apply all conditions
        if conditions:
            query = query.filter(and_(*conditions))
        
        # Get total count before pagination
        count_query = query.with_entities(func.count(Parcel.parcel_id.distinct()))
        total_count = count_query.scalar() or 0
        
        # Apply sorting
        sort_by = filters.sort_by or "relevance"
        
        if sort_by == "price_asc":
            query = query.order_by(
                func.coalesce(Listing.list_price, AvmValuation.estimated_value).asc().nullslast()
            )
        elif sort_by == "price_desc":
            query = query.order_by(
                func.coalesce(Listing.list_price, AvmValuation.estimated_value).desc().nullsfirst()
            )
        elif sort_by == "newest":
            query = query.order_by(Parcel.year_built.desc().nullslast())
        elif sort_by == "oldest":
            query = query.order_by(Parcel.year_built.asc().nullslast())
        elif sort_by == "sqft_desc":
            query = query.order_by(
                func.coalesce(Listing.square_feet, Parcel.square_feet).desc().nullslast()
            )
        else:
            # Default: relevance - Active first, then Pending, then Off-market, then by price desc
            query = query.order_by(
                case(
                    (Listing.status == 'Active', 0),
                    (Listing.status == 'Pending', 1),
                    else_=2  # Off-market
                ),
                func.coalesce(Listing.list_price, AvmValuation.estimated_value).desc().nullslast()
            )
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Execute query
        results = query.all()
        
        build_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        logger.info(f"[SearchQueryBuilder] Query built in {build_time_ms}ms, {total_count} total results")
        
        return results, total_count
    
    def compute_relevance_score(
        self,
        result: Any,
        filters: ParsedSearchFilters
    ) -> Tuple[float, List[str]]:
        """
        Compute a relevance score (0-100) for a search result.
        
        Returns:
            Tuple of (score, list of matching highlights)
        """
        score = 0.0
        highlights = []
        total_filters = 0
        matched_filters = 0
        
        # Check each filter criterion
        if filters.bedrooms_min:
            total_filters += 1
            if result.bedrooms and result.bedrooms >= filters.bedrooms_min:
                matched_filters += 1
                highlights.append(f"{result.bedrooms} bedrooms")
        
        if filters.bathrooms_min:
            total_filters += 1
            if result.bathrooms and float(result.bathrooms) >= filters.bathrooms_min:
                matched_filters += 1
                highlights.append(f"{result.bathrooms} baths")
        
        if filters.price_max:
            total_filters += 1
            effective_price = result.list_price or result.avm_estimate
            if effective_price and float(effective_price) <= filters.price_max:
                matched_filters += 1
                price_str = f"${float(effective_price):,.0f}"
                highlights.append(f"under ${filters.price_max/1000:.0f}k")
        
        if filters.price_min:
            total_filters += 1
            effective_price = result.list_price or result.avm_estimate
            if effective_price and float(effective_price) >= filters.price_min:
                matched_filters += 1
                highlights.append(f"over ${filters.price_min/1000:.0f}k")
        
        if filters.cities:
            total_filters += 1
            if result.city and result.city.lower() in [c.lower() for c in filters.cities]:
                matched_filters += 1
                highlights.append(f"in {result.city}")
        
        if filters.square_feet_min:
            total_filters += 1
            if result.square_feet and result.square_feet >= filters.square_feet_min:
                matched_filters += 1
                highlights.append(f"{result.square_feet:,} sqft")
        
        if filters.property_types:
            total_filters += 1
            # Flatten normalized types for matching
            normalized_types = []
            for t in filters.property_types:
                normalized_types.extend(self._normalize_property_type(t))
            if result.property_type and result.property_type in normalized_types:
                matched_filters += 1
                highlights.append(result.property_type)
        
        # Calculate score
        if total_filters > 0:
            score = (matched_filters / total_filters) * 100
        else:
            score = 50  # Neutral score if no specific filters
        
        # Bonus for listing status
        if result.listing_id:
            if result.listing_status == 'Active':
                score = min(100, score + 15)
                highlights.insert(0, "Active Listing")
            elif result.listing_status == 'Pending':
                score = min(100, score + 10)
                highlights.insert(0, "Pending")
        else:
            # Off-market property
            highlights.insert(0, "Off-Market")
        
        return round(score, 1), highlights


# Global instance factory
def get_search_builder(db: Session) -> SearchQueryBuilder:
    """Factory function to create a SearchQueryBuilder with a database session."""
    return SearchQueryBuilder(db)




