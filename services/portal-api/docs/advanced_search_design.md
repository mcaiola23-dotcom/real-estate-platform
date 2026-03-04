# Advanced Search & Filtering System - Design Document

**Date**: 2025-11-13  
**Phase**: Phase 1 - Property Display & Search (75% → 90%)  
**Status**: Planning → Implementation

---

## Executive Summary

This document outlines the design for a comprehensive property search and filtering system that serves as the foundation for both **manual search** (immediate) and **AI-powered natural language search** (Phase 3). The architecture prioritizes user experience, performance, and extensibility.

---

## 1. User Experience Design

### 1.1 Search Interface Layout

**Primary Search Panel** (Left Sidebar - 320px wide)

```
┌─────────────────────────────────┐
│  🔍 Property Search             │
├─────────────────────────────────┤
│                                 │
│  [Search Address or City...]    │  ← Autocomplete input
│   Suggestions:                  │
│   • 123 Main St, Stamford       │
│   • 456 Oak Ave, Greenwich      │
│                                 │
├─────────────────────────────────┤
│  Filters                        │
│                                 │
│  Price Range                    │
│  [Min $____] - [Max $____]      │
│  ◄────────○────────►            │  ← Dual slider
│                                 │
│  Bedrooms:  [Any ▼]             │
│  Bathrooms: [Any ▼]             │
│                                 │
│  Property Type                  │
│  □ Single Family                │
│  □ Condo                        │
│  □ Multi-Family                 │
│  □ Commercial                   │
│  □ Land                         │
│                                 │
│  Square Footage                 │
│  [Min ____] - [Max ____]        │
│  ◄────────○────────►            │
│                                 │
│  Lot Size (acres)               │
│  [Min ____] - [Max ____]        │
│  ◄────────○────────►            │
│                                 │
│  Status:    [Active ▼]          │
│                                 │
│  [Apply Filters]                │
│  [Clear All]                    │
│                                 │
│  ─────────────────              │
│  💾 Save this search            │  ← Non-invasive, optional
│                                 │
└─────────────────────────────────┘
```

**Future AI Search Integration** (Same Panel, Different Mode)

```
┌─────────────────────────────────┐
│  🤖 AI Search                   │  ← Tab switch
├─────────────────────────────────┤
│                                 │
│  "Find me 4-bedroom homes       │
│   under $1M near good           │
│   schools in Darien"            │  ← Natural language
│                                 │
│  [Search with AI]               │
│                                 │
│  ─────────────────              │
│  💡 AI interpreted as:          │  ← Show filters extracted
│    • Bedrooms: 4+               │
│    • Price: < $1,000,000        │
│    • City: Darien               │
│    • School Rating: 8+          │
│                                 │
│  [Refine] [Use These Filters]   │
│                                 │
└─────────────────────────────────┘
```

### 1.2 Results Display

**Map View** (Default - covers 80% of screen)
- Parcels highlighted based on search criteria
- Color-coded by price range or property type
- Hover shows quick property card
- Click opens full detail modal
- Result count badge: "47 properties match your search"

**List View** (Grid of cards)
- Grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Property cards with thumbnail, price, beds/baths, address
- Sorting options: Price (↑↓), Date Listed, Beds, Baths, Sqft
- Pagination: 30 results per page
- Quick actions: Pin, Share, View Details

### 1.3 Empty State Handling

When no results found:
```
┌─────────────────────────────────────┐
│                                     │
│         🏘️                          │
│                                     │
│    No properties match your search  │
│                                     │
│    Try:                             │
│    • Expanding your price range     │
│    • Reducing bedroom requirements  │
│    • Selecting more property types  │
│    • Searching a different area     │
│                                     │
│    [Show All Available Properties]  │
│    [Clear Filters]                  │
│                                     │
└─────────────────────────────────────┘
```

### 1.4 Saved Searches

**Non-Invasive Prompt** (appears after 2nd successful search):
- Small tooltip above "Save this search" button
- "Save this search to get notifications?" 
- One-click save, no modal interruption
- Stored in localStorage (Phase 1) or user account (Phase 2)

**Saved Searches UI** (dropdown or separate tab):
```
Recent Searches:
• $800K-$1.2M, 4+ bed, Stamford (47 results)
• Condos under $500K (12 results)
• Commercial properties, Norwalk (8 results)
```

---

## 2. Backend Architecture

### 2.1 Enhanced Search Endpoint

**Current**: `POST /api/search/properties`  
**Status**: Partially functional (basic filters only)  
**Enhancement**: Add comprehensive filter support

#### Request Schema (Enhanced)

```python
class PropertySearchRequest(BaseModel):
    query: Optional[str] = None  # Address/city text search
    filters: Optional[PropertySearchFilters] = None
    page: int = 1
    page_size: int = 30
    sort: Optional[SortOptions] = None
    include: List[str] = ["list", "map"]  # What to include in response

class PropertySearchFilters(BaseModel):
    # Existing
    status: Optional[List[str]] = None  # ["Active", "Pending", "Sold"]
    towns: Optional[List[str]] = None
    property_types: Optional[List[str]] = None
    price: Optional[PriceRange] = None
    bedrooms: Optional[int] = None  # Minimum
    bathrooms: Optional[float] = None  # Minimum
    bbox: Optional[str] = None  # Bounding box for map
    
    # NEW - To be added
    square_feet: Optional[RangeFilter] = None  # Min/max
    lot_size_acres: Optional[RangeFilter] = None  # Min/max
    year_built: Optional[RangeFilter] = None  # Min/max
    garage_spaces: Optional[int] = None  # Minimum
    has_pool: Optional[bool] = None
    waterfront: Optional[bool] = None
    
    # Future AI integration
    ai_query: Optional[str] = None  # Natural language query
    ai_extracted_filters: Optional[Dict] = None  # AI-parsed filters

class RangeFilter(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None

class SortOptions(BaseModel):
    field: str = "list_price"  # price, date, beds, baths, sqft, lot_size
    direction: str = "desc"  # asc or desc
```

#### Response Schema (Enhanced)

```python
class PropertySearchResponse(BaseModel):
    summary: PropertySearchSummary
    results: List[PropertySearchResult]
    map: MapHighlightBlock
    
    # NEW - To be added
    facets: Optional[SearchFacets] = None  # For filter refinement
    suggestions: Optional[List[str]] = None  # Address autocomplete

class SearchFacets(BaseModel):
    """Aggregated data for filter UI"""
    price_ranges: Dict[str, int]  # "$0-$500K": 45, "$500K-$1M": 67
    property_type_counts: Dict[str, int]  # "SingleFamily": 120
    town_counts: Dict[str, int]  # "Stamford": 89
    min_price: float
    max_price: float
    min_sqft: Optional[int]
    max_sqft: Optional[int]
    min_lot_size: Optional[float]
    max_lot_size: Optional[float]
```

### 2.2 New Autocomplete Endpoint

**Endpoint**: `GET /api/search/autocomplete`

**Purpose**: Provide type-ahead address suggestions as user types

#### Request Parameters
```python
query: str  # User's partial input (min 3 chars)
limit: int = 10  # Max suggestions to return
types: Optional[List[str]] = ["address", "city", "zip"]  # What to suggest
```

#### Response Schema
```python
class AutocompleteResponse(BaseModel):
    suggestions: List[AutocompleteSuggestion]

class AutocompleteSuggestion(BaseModel):
    text: str  # "123 Main St, Stamford, CT 06902"
    type: str  # "address", "city", "zip", "town"
    parcel_id: Optional[str] = None  # If address match
    match_score: float  # 0.0-1.0 relevance
    highlight: Optional[str] = None  # HTML with <mark> tags
```

#### Implementation Strategy
- Use PostgreSQL full-text search (`to_tsvector`, `to_tsquery`)
- Index on `address_full`, `city`, `town_name`, `zip_code`
- Rank by relevance + listing status (active listings ranked higher)
- Cache frequent searches in Redis (future optimization)

### 2.3 Database Query Optimization

**Current Indexes**:
```sql
-- Existing
CREATE INDEX idx_parcel_city ON parcels(city);
CREATE INDEX idx_parcel_zip ON parcels(zip_code);
CREATE INDEX idx_parcel_property_type ON parcels(property_type);
CREATE INDEX idx_listing_status ON listings(status);
CREATE INDEX idx_listing_price ON listings(list_price);
```

**New Indexes Required**:
```sql
-- Full-text search
CREATE INDEX idx_parcel_address_fts ON parcels USING gin(to_tsvector('english', address_full));
CREATE INDEX idx_parcel_city_fts ON parcels USING gin(to_tsvector('english', city));

-- Range filters
CREATE INDEX idx_listing_sqft ON listings(square_feet);
CREATE INDEX idx_listing_bedrooms ON listings(bedrooms);
CREATE INDEX idx_listing_bathrooms ON listings(bathrooms);
CREATE INDEX idx_parcel_lot_size ON parcels(lot_size_acres);
CREATE INDEX idx_listing_year_built ON listings(year_built);

-- Composite indexes for common filter combinations
CREATE INDEX idx_listing_status_price ON listings(status, list_price);
CREATE INDEX idx_listing_beds_baths ON listings(bedrooms, bathrooms);
CREATE INDEX idx_parcel_type_city ON parcels(property_type, city);
```

**Query Performance Targets**:
- Autocomplete: < 100ms (indexed text search)
- Filter search: < 500ms (with up to 5 filters applied)
- Map bbox query: < 300ms (spatial index)
- Facets aggregation: < 200ms (indexed counts)

---

## 3. Frontend Architecture

### 3.1 Component Structure

```
components/
├── search/
│   ├── SearchPanel.tsx              # Main search container
│   ├── SearchInput.tsx              # Address autocomplete
│   ├── FilterControls.tsx           # All filter inputs
│   ├── PriceRangeSlider.tsx         # Dual-handle slider
│   ├── PropertyTypeCheckboxes.tsx   # Multi-select checkboxes
│   ├── BedroomBathroomSelect.tsx    # Dropdown selectors
│   ├── SquareFootageFilter.tsx      # Range input
│   ├── LotSizeFilter.tsx            # Range input with acres
│   ├── StatusFilter.tsx             # Dropdown or radio
│   ├── SaveSearchButton.tsx         # Save search UI
│   ├── SavedSearchesList.tsx        # View saved searches
│   └── SearchResultsSummary.tsx     # "X properties match..."
```

### 3.2 State Management

**React Context API** (for now - simple and effective)

```typescript
interface SearchContextState {
  // Search state
  searchQuery: string
  filters: PropertyFilters
  sortBy: SortOptions
  viewMode: 'map' | 'list'
  
  // Results state
  results: PropertySearchResult[]
  mapParcels: ParcelData[]
  summary: SearchSummary
  loading: boolean
  error: string | null
  
  // UI state
  showSavePrompt: boolean
  savedSearches: SavedSearch[]
  
  // Actions
  updateFilters: (filters: Partial<PropertyFilters>) => void
  clearFilters: () => void
  executeSearch: () => Promise<void>
  saveCurrentSearch: (name: string) => void
  loadSavedSearch: (searchId: string) => void
}
```

**Future Zustand Migration** (if state complexity grows)
- Better DevTools
- Simpler async actions
- Easier testing

### 3.3 Autocomplete Implementation

**Library**: `@headlessui/react` (Combobox component)

```tsx
<Combobox value={selectedAddress} onChange={handleAddressSelect}>
  <Combobox.Input
    onChange={(e) => handleInputChange(e.target.value)}
    placeholder="Search by address, city, or zip..."
  />
  <Combobox.Options>
    {suggestions.map((suggestion) => (
      <Combobox.Option key={suggestion.text} value={suggestion}>
        <span dangerouslySetInnerHTML={{ __html: suggestion.highlight }} />
        <span className="text-gray-500">{suggestion.type}</span>
      </Combobox.Option>
    ))}
  </Combobox.Options>
</Combobox>
```

**Debouncing**: 300ms delay before API call (use `useDebouncedValue` hook)

### 3.4 Range Sliders

**Library**: `rc-slider` (mature, customizable)

```tsx
<Slider
  range
  min={0}
  max={10000000}
  step={50000}
  value={[filters.minPrice, filters.maxPrice]}
  onChange={handlePriceChange}
  marks={{
    0: '$0',
    5000000: '$5M',
    10000000: '$10M+'
  }}
/>
```

**User-Friendly Inputs**:
- Display formatted values ($750,000 not 750000)
- Allow manual text input alongside sliders
- Snap to common increments ($50K for price, 100 sqft, 0.5 acres)

---

## 4. AI Search Integration (Future - Phase 3)

### 4.1 Architecture Overview

**Two-Mode System**:
1. **Manual Search** (Phase 1) - Traditional filters
2. **AI Search** (Phase 3) - Natural language → filters

**Shared Backend**:
- Same `/api/search/properties` endpoint
- AI query → filter extraction → standard query execution
- Results identical regardless of input method

### 4.2 AI Query Flow

```
User Input: "4 bedroom homes under $1M near good schools in Darien"
    ↓
OpenAI API (GPT-4)
    ↓
Structured Filter Extraction:
{
  "bedrooms": 4,
  "price": { "max": 1000000 },
  "towns": ["Darien"],
  "additional_criteria": {
    "school_rating": { "min": 8 }
  }
}
    ↓
Backend Search Endpoint (same as manual search)
    ↓
Results + AI Interpretation Summary
```

### 4.3 Frontend AI Search UI

**Tab System** in Search Panel:
```
[ Manual Search ]  [ AI Search ]
```

**AI Search Tab**:
- Large text area for natural language query
- "Search with AI" button
- Loading state: "AI is interpreting your search..."
- Result: Show extracted filters (transparent)
- Option: "Use these filters" → switch to Manual tab with pre-filled filters

**Benefits**:
- User can verify AI understood correctly
- Manual refinement possible
- Educational (users learn filter options)
- Fallback to manual if AI fails

### 4.4 AI Implementation Plan (Future)

**Backend Service**: `backend/app/services/ai_search.py`

```python
class AISearchService:
    def parse_natural_language_query(self, query: str) -> PropertySearchFilters:
        """
        Use OpenAI GPT-4 to extract structured filters from natural language
        
        Example:
        "3 bed homes in Stamford under $800K" 
        → PropertySearchFilters(bedrooms=3, towns=["Stamford"], price=PriceRange(max=800000))
        """
        prompt = self._build_extraction_prompt(query)
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}, 
                      {"role": "user", "content": query}],
            functions=[self._get_filter_schema()],
            function_call="auto"
        )
        return self._parse_ai_response(response)
```

**Cost Consideration**:
- GPT-4 API: ~$0.01-0.03 per query
- Cache common queries to reduce costs
- Rate limit to prevent abuse
- Fallback to manual search if API unavailable

---

## 5. Implementation Phases

### Phase 1A: Backend Enhancement (Week 1)

**Tasks**:
1. ✅ Add new filter fields to `PropertySearchFilters` schema
2. ✅ Implement range filters (sqft, lot_size) in search endpoint
3. ✅ Create autocomplete endpoint with full-text search
4. ✅ Add database indexes for new fields
5. ✅ Implement facets aggregation for filter suggestions
6. ✅ Write unit tests for all new endpoints

**Success Criteria**:
- All filter combinations return correct results
- Autocomplete responds < 100ms
- Search with 5 filters executes < 500ms
- Facets calculation < 200ms

### Phase 1B: Frontend Implementation (Week 1-2)

**Tasks**:
1. ✅ Create search context and state management
2. ✅ Build SearchInput component with autocomplete
3. ✅ Implement PriceRangeSlider with dual handles
4. ✅ Add PropertyTypeCheckboxes (multi-select)
5. ✅ Build SquareFootageFilter and LotSizeFilter
6. ✅ Add BedroomBathroomSelect dropdowns
7. ✅ Create StatusFilter dropdown
8. ✅ Integrate all filters with backend API
9. ✅ Update map to highlight filtered results
10. ✅ Add SaveSearchButton (localStorage for now)

**Success Criteria**:
- All filters functional and responsive
- Autocomplete shows suggestions as user types
- Map updates when filters change
- Results display correctly in both map and list views
- Performance smooth on typical searches (< 1s)

### Phase 1C: Polish & Optimization (Week 2)

**Tasks**:
1. ✅ Add loading states and skeleton screens
2. ✅ Implement empty state UI
3. ✅ Add filter validation and error handling
4. ✅ Implement "Clear All Filters" button
5. ✅ Add keyboard shortcuts (Enter to search, Esc to clear)
6. ✅ Mobile responsive design
7. ✅ Add analytics tracking (Google Analytics)
8. ✅ Performance optimization (memoization, debouncing)
9. ✅ Write E2E tests with Playwright

**Success Criteria**:
- No visual glitches or layout shifts
- All interactions feel instant
- Mobile experience smooth
- Zero accessibility violations (WCAG AA)

### Phase 3: AI Search Integration (Future - Month 3)

**Tasks** (after Phase 1 complete):
1. Add AI Search tab to SearchPanel
2. Build AI query input component
3. Create backend AI service (OpenAI integration)
4. Implement filter extraction from natural language
5. Add AI interpretation display (show extracted filters)
6. Add "Use these filters" button to switch modes
7. Implement query refinement flow
8. Add cost monitoring and rate limiting
9. Cache common AI queries
10. A/B test AI vs manual search effectiveness

---

## 6. Success Metrics

### User Experience Metrics
- **Search Completion Rate**: % of searches that return results > 90%
- **Filter Usage**: Avg filters per search = 2-3
- **Save Search Rate**: % of users saving searches > 10%
- **Time to Result**: Median time from search to property click < 10s

### Technical Metrics
- **API Response Time**: P95 < 500ms
- **Autocomplete Latency**: P95 < 100ms
- **Map Update Time**: < 300ms after filter change
- **Error Rate**: < 0.5% of searches

### Business Metrics
- **Engagement**: Avg searches per session > 3
- **Conversion**: % of searches leading to property detail view > 40%
- **Retention**: % of users returning to saved searches > 25%

---

## 7. Open Questions & Decisions Needed

### Q1: Price Range Presets
Should we provide quick-select price ranges?
- **Option A**: Dropdown with "$0-$500K", "$500K-$1M", "$1M-$2M", etc.
- **Option B**: Just slider (more flexible)
- **Option C**: Both (slider + presets)

**Recommendation**: Option C - Best of both worlds

### Q2: Property Type Display
How should property types be organized?
- **Option A**: Flat list (Single Family, Condo, Multi-Family, Commercial, Land)
- **Option B**: Grouped (Residential: Single, Condo, Multi | Commercial | Land)
- **Option C**: Hierarchical with subtypes (Single Family → Colonial, Ranch, etc.)

**Recommendation**: Option A for Phase 1, Option B for Phase 2

### Q3: Square Footage Units
Display in sqft or allow metric conversion?
- **Option A**: Only sqft (US standard)
- **Option B**: Toggle sqft/m²

**Recommendation**: Option A for MVP (simplicity)

### Q4: Lot Size Units
Acres, sqft, or both?
- **Option A**: Acres only (standard for CT real estate)
- **Option B**: Both with toggle
- **Option C**: Auto-switch (< 1 acre = sqft, >= 1 acre = acres)

**Recommendation**: Option C - Most intuitive

### Q5: Saved Search Storage
Where to store saved searches?
- **Option A**: LocalStorage (Phase 1 - no auth required)
- **Option B**: Database (Phase 2 - requires user accounts)
- **Option C**: Both (localStorage initially, sync to DB when user logs in)

**Recommendation**: Option C - Progressive enhancement

---

## 8. Risk Mitigation

### Risk 1: Performance Degradation
**Risk**: Complex filters + large dataset = slow queries
**Mitigation**:
- Add comprehensive database indexes
- Implement query result caching (Redis)
- Use query explain/analyze to optimize
- Set hard timeout limits (5s max)
- Monitor query performance with APM tools

### Risk 2: Poor Autocomplete Relevance
**Risk**: Suggestions don't match user intent
**Mitigation**:
- Use full-text search ranking
- Boost active listings in results
- Implement click-through tracking to improve ranking
- Add fuzzy matching for typos
- Show result type (address vs city) clearly

### Risk 3: Mobile Performance
**Risk**: Sliders and complex UI slow on mobile
**Mitigation**:
- Use native mobile inputs where possible
- Simplify filter UI on small screens
- Implement filter drawer/modal on mobile
- Test on low-end devices
- Use Performance API to monitor

### Risk 4: AI Search Hallucination (Phase 3)
**Risk**: AI misinterprets query, bad filters
**Mitigation**:
- Always show extracted filters (transparency)
- Require user confirmation before search
- Allow manual refinement
- Validate AI-extracted filters server-side
- Log AI failures for model improvement

---

## 9. Future Enhancements (Post-MVP)

### Advanced Filters
- Schools (rating, district)
- Commute time to address
- HOA fees (range)
- Days on market
- Price per sqft
- Tax amount (range)
- Renovated in last X years
- Specific features (fireplace, hardwood, etc.)

### Smart Suggestions
- "Similar properties" based on current search
- "Price drop alerts" for saved searches
- "You might also like..." recommendations
- "Trending searches in your area"

### Visualization Enhancements
- Heatmap view (price density, days on market)
- Cluster view at low zoom (parcel grouping)
- Draw custom search boundary on map
- Saved map views

### Social Features
- Share searches with friends/family
- Collaborative search (multiple users)
- Comments on properties
- "Favorites" vs "Rejected" tracking

---

## 10. Conclusion

This design provides a solid foundation for both immediate manual search functionality and future AI-powered search. The architecture is:

1. **User-Centric**: Intuitive filters, clear results, helpful suggestions
2. **Performant**: Indexed queries, optimized rendering, caching strategies
3. **Extensible**: Easy to add new filters, AI integration planned
4. **Maintainable**: Clear component structure, typed APIs, comprehensive tests

**Next Steps**:
1. User/stakeholder review of this design
2. Backend API implementation (Phase 1A)
3. Frontend UI implementation (Phase 1B)
4. Testing and optimization (Phase 1C)
5. User feedback and iteration

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-13  
**Author**: AI Assistant (Executor Mode)  
**Review Status**: Pending User Approval

