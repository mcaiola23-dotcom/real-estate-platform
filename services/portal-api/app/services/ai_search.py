"""
AI Natural Language Search Service

Uses OpenAI GPT-4o-mini to parse natural language property search queries
into structured filters that can be executed against the database.

Example:
    "4 bedroom homes under $800k in Stamford with a pool"
    -> {bedrooms_min: 4, price_max: 800000, cities: ["Stamford"], features: ["pool"]}
"""

import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from openai import OpenAI
from ..core.config import settings

# Configure logging
logger = logging.getLogger(__name__)


class AISearchService:
    """
    Service for parsing natural language search queries using OpenAI.
    
    Uses GPT-4o-mini with function calling for reliable, structured output.
    Cost: ~$0.01-0.03 per query.
    """
    
    # Fairfield County towns for context
    FAIRFIELD_COUNTY_TOWNS = [
        "Bethel", "Bridgeport", "Brookfield", "Danbury", "Darien",
        "Easton", "Fairfield", "Greenwich", "Monroe", "New Canaan",
        "New Fairfield", "Newtown", "Norwalk", "Redding", "Ridgefield",
        "Shelton", "Sherman", "Stamford", "Stratford", "Trumbull",
        "Weston", "Westport", "Wilton"
    ]
    
    # Property types in our database
    PROPERTY_TYPES = [
        "Single Family",
        "Condo",
        "Multi-Family",
        "Townhouse",
        "Land",
        "Commercial"
    ]
    
    # Common features/amenities
    COMMON_FEATURES = [
        "pool", "garage", "waterfront", "water views", "fireplace",
        "basement", "attic", "deck", "patio", "central air",
        "hardwood floors", "updated kitchen", "renovated",
        "new construction", "solar panels", "smart home"
    ]
    
    def __init__(self):
        """Initialize the AI search service."""
        self.api_key = settings.openai_api_key
        self.model = settings.openai_model
        self.temperature = settings.openai_temperature
        self.max_tokens = settings.openai_max_tokens
        self.timeout = settings.openai_timeout
        
        if not self.api_key:
            logger.warning("[AISearchService] OPENAI_API_KEY not configured")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
            logger.info(f"[AISearchService] Initialized with model: {self.model}")
    
    def is_available(self) -> bool:
        """Check if the AI search service is available."""
        return self.client is not None
    
    def _get_system_prompt(self) -> str:
        """
        Get the system prompt for the AI model.
        
        This prompt defines the task, available filters, and expected output format.
        """
        return f"""You are a real estate search assistant for Fairfield County, Connecticut.
Your task is to parse natural language property search queries into structured filters.

IMPORTANT: By default, users are searching for ACTIVE LISTINGS (properties currently for sale).
Only set include_off_market=true if the user EXPLICITLY asks to see off-market properties.

AVAILABLE FILTERS:
- price_min, price_max: Integer dollar amounts (e.g., 500000 for $500k)
- bedrooms_min, bedrooms_max: Integer bedroom counts
- bathrooms_min, bathrooms_max: Float bathroom counts (e.g., 2.5)
- square_feet_min, square_feet_max: Integer square footage
- lot_acres_min, lot_acres_max: Float lot size in acres
- year_built_min, year_built_max: Integer year
- property_types: List of property types from: {self.PROPERTY_TYPES}
- cities: List of cities from Fairfield County: {self.FAIRFIELD_COUNTY_TOWNS}
- zip_codes: List of 5-digit ZIP codes
- features: List of desired features (pool, garage, waterfront, etc.)
- fuzzy_terms: Relative terms that need context-aware interpretation:
  - "affordable" - lower price range
  - "luxury" - high-end properties
  - "spacious" - larger square footage
  - "fixer-upper" - needs work, lower price
  - "move-in ready" - updated/renovated
  - "family-friendly" - good for families
- sort_by: One of "price_asc", "price_desc", "newest", "oldest", "sqft_desc", "relevance"
- include_off_market: Boolean - ONLY set to true if user explicitly asks for off-market properties

OFF-MARKET DETECTION:
Set include_off_market=true ONLY when user uses phrases like:
- "off-market", "off market", "offmarket"
- "not for sale", "not currently for sale", "not listed"
- "not currently available", "not on the market"
- "unlisted properties", "unlisted homes"
- "all properties" (when they want everything, not just listings)
- "including off-market", "include off-market"
- "valued at" or "estimated at" (implies AVM values, not list prices)

Do NOT set include_off_market=true for normal searches like:
- "homes in Stamford" (just wants active listings)
- "4 bedroom houses under $800k" (just wants active listings)

RULES:
1. Extract ALL relevant filters from the query
2. Use exact city names from the list (correct spelling/capitalization)
3. Convert price expressions: "$1M" = 1000000, "$800k" = 800000
4. For "3+ bedrooms" set bedrooms_min = 3
5. For "under $500k" set price_max = 500000
6. For "over 2000 sqft" set square_feet_min = 2000
7. If a term is relative/fuzzy (affordable, luxury, spacious), add it to fuzzy_terms
8. Only include fields that are explicitly or implicitly mentioned
9. Return valid JSON that matches the schema exactly
10. Default to searching active listings only (do NOT include include_off_market unless explicitly requested)

EXAMPLES:
Query: "4 bedroom homes under $1M in Greenwich"
Output: {{"bedrooms_min": 4, "price_max": 1000000, "cities": ["Greenwich"]}}

Query: "Affordable condos in Stamford or Norwalk"
Output: {{"property_types": ["Condo"], "cities": ["Stamford", "Norwalk"], "fuzzy_terms": ["affordable"]}}

Query: "Luxury waterfront properties over 3000 sqft"
Output: {{"square_feet_min": 3000, "features": ["waterfront"], "fuzzy_terms": ["luxury"]}}

Query: "off-market properties in Westport valued between $900K and $1.5M"
Output: {{"price_min": 900000, "price_max": 1500000, "cities": ["Westport"], "include_off_market": true}}

Query: "homes not currently for sale in Darien"
Output: {{"cities": ["Darien"], "include_off_market": true}}

Query: "all properties in New Canaan including off market"
Output: {{"cities": ["New Canaan"], "include_off_market": true}}"""

    def _get_function_schema(self) -> Dict[str, Any]:
        """
        Get the function schema for structured output.
        
        This ensures the AI returns properly formatted JSON.
        """
        return {
            "name": "extract_search_filters",
            "description": "Extract structured search filters from a natural language property search query",
            "parameters": {
                "type": "object",
                "properties": {
                    "price_min": {
                        "type": "integer",
                        "description": "Minimum price in dollars"
                    },
                    "price_max": {
                        "type": "integer",
                        "description": "Maximum price in dollars"
                    },
                    "bedrooms_min": {
                        "type": "integer",
                        "description": "Minimum number of bedrooms"
                    },
                    "bedrooms_max": {
                        "type": "integer",
                        "description": "Maximum number of bedrooms"
                    },
                    "bathrooms_min": {
                        "type": "number",
                        "description": "Minimum number of bathrooms"
                    },
                    "bathrooms_max": {
                        "type": "number",
                        "description": "Maximum number of bathrooms"
                    },
                    "square_feet_min": {
                        "type": "integer",
                        "description": "Minimum square footage"
                    },
                    "square_feet_max": {
                        "type": "integer",
                        "description": "Maximum square footage"
                    },
                    "lot_acres_min": {
                        "type": "number",
                        "description": "Minimum lot size in acres"
                    },
                    "lot_acres_max": {
                        "type": "number",
                        "description": "Maximum lot size in acres"
                    },
                    "year_built_min": {
                        "type": "integer",
                        "description": "Minimum year built"
                    },
                    "year_built_max": {
                        "type": "integer",
                        "description": "Maximum year built"
                    },
                    "property_types": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of property types to search"
                    },
                    "cities": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of cities in Fairfield County"
                    },
                    "zip_codes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of ZIP codes"
                    },
                    "features": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of desired property features"
                    },
                    "fuzzy_terms": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Relative terms requiring context (affordable, luxury, spacious, etc.)"
                    },
                    "sort_by": {
                        "type": "string",
                        "enum": ["price_asc", "price_desc", "newest", "oldest", "sqft_desc", "relevance"],
                        "description": "How to sort results"
                    },
                    "include_off_market": {
                        "type": "boolean",
                        "description": "Set to true ONLY if user explicitly asks for off-market/unlisted properties"
                    }
                },
                "required": []
            }
        }

    def parse_query(self, query: str) -> Dict[str, Any]:
        """
        Parse a natural language search query into structured filters.
        
        Args:
            query: Natural language search query (e.g., "4 bed homes under $800k in Stamford")
            
        Returns:
            Dictionary with parsed filters and metadata:
            {
                "success": True/False,
                "filters": { ... parsed filters ... },
                "original_query": "...",
                "parse_time_ms": 123,
                "error": "..." (if success=False)
            }
        """
        start_time = datetime.now()
        
        if not self.is_available():
            return {
                "success": False,
                "filters": {},
                "original_query": query,
                "parse_time_ms": 0,
                "error": "AI search service not configured (missing API key)"
            }
        
        if not query or not query.strip():
            return {
                "success": False,
                "filters": {},
                "original_query": query,
                "parse_time_ms": 0,
                "error": "Empty query"
            }
        
        try:
            logger.info(f"[AISearchService] Parsing query: {query}")
            
            # Call OpenAI with function calling
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": f"Parse this property search query: {query}"}
                ],
                functions=[self._get_function_schema()],
                function_call={"name": "extract_search_filters"},
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                timeout=self.timeout
            )
            
            # Extract the function call arguments
            function_call = response.choices[0].message.function_call
            
            if function_call and function_call.arguments:
                filters = json.loads(function_call.arguments)
                
                # Clean up empty values
                filters = {k: v for k, v in filters.items() if v is not None and v != [] and v != ""}
                
                parse_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
                
                logger.info(f"[AISearchService] Parsed filters: {filters}")
                logger.info(f"[AISearchService] Parse time: {parse_time_ms}ms")
                
                return {
                    "success": True,
                    "filters": filters,
                    "original_query": query,
                    "parse_time_ms": parse_time_ms,
                    "model": self.model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }
            else:
                raise ValueError("No function call in response")
                
        except json.JSONDecodeError as e:
            logger.error(f"[AISearchService] JSON parse error: {e}")
            parse_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            return {
                "success": False,
                "filters": {},
                "original_query": query,
                "parse_time_ms": parse_time_ms,
                "error": f"Failed to parse AI response: {str(e)}"
            }
            
        except Exception as e:
            logger.error(f"[AISearchService] Error: {e}")
            parse_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            return {
                "success": False,
                "filters": {},
                "original_query": query,
                "parse_time_ms": parse_time_ms,
                "error": str(e)
            }
    
    def generate_explanation(self, filters: Dict[str, Any], result_count: int) -> str:
        """
        Generate a human-readable explanation of the search results.
        
        Args:
            filters: Parsed search filters
            result_count: Number of results found
            
        Returns:
            Human-readable explanation string
        """
        parts = []
        
        # Result count
        if result_count == 0:
            parts.append("No properties found")
        elif result_count == 1:
            parts.append("Found 1 property")
        else:
            parts.append(f"Found {result_count} properties")
        
        # Build description of filters
        descriptions = []
        
        if filters.get("bedrooms_min"):
            descriptions.append(f"{filters['bedrooms_min']}+ bedrooms")
        
        if filters.get("bathrooms_min"):
            descriptions.append(f"{filters['bathrooms_min']}+ bathrooms")
        
        if filters.get("price_max"):
            price = filters["price_max"]
            if price >= 1000000:
                descriptions.append(f"under ${price/1000000:.1f}M")
            else:
                descriptions.append(f"under ${price/1000:,.0f}k")
        
        if filters.get("price_min"):
            price = filters["price_min"]
            if price >= 1000000:
                descriptions.append(f"over ${price/1000000:.1f}M")
            else:
                descriptions.append(f"over ${price/1000:,.0f}k")
        
        if filters.get("square_feet_min"):
            descriptions.append(f"over {filters['square_feet_min']:,} sqft")
        
        if filters.get("cities"):
            cities = filters["cities"]
            if len(cities) == 1:
                descriptions.append(f"in {cities[0]}")
            elif len(cities) == 2:
                descriptions.append(f"in {cities[0]} or {cities[1]}")
            else:
                descriptions.append(f"in {', '.join(cities[:-1])}, or {cities[-1]}")
        
        if filters.get("property_types"):
            types = filters["property_types"]
            if len(types) == 1:
                descriptions.append(types[0].lower())
        
        if filters.get("features"):
            features = filters["features"]
            descriptions.append(f"with {', '.join(features)}")
        
        # Add off-market indicator
        if filters.get("include_off_market"):
            descriptions.append("(including off-market)")
        
        if filters.get("fuzzy_terms"):
            # These are handled separately in the UI
            pass
        
        if descriptions:
            parts.append("with")
            parts.append(", ".join(descriptions))
        
        return " ".join(parts)


# Global instance
ai_search_service = AISearchService()




