# SimplyRETS Integration Guide

## Overview

SimplyRETS is an API service that provides access to MLS (Multiple Listing Service) data, including SmartMLS for Fairfield County, CT. It allows us to access active listings, sold properties, agent information, and photos - all the data that powers real estate websites.

## What We've Already Built

✅ **Complete SimplyRETS Service** (`backend/app/services/simplyrets.py`)
- API client with retry logic and error handling
- Coordinate validation for Fairfield County
- Complete field mapping and transformation
- Methods to fetch properties, individual listings, and health checks

✅ **API Endpoints** (`backend/app/api/routes/simplyrets.py`)
- `GET /simplyrets/properties` - Search/filter listings
- `GET /simplyrets/properties/{mls_id}` - Get specific listing
- `GET /simplyrets/health` - Check API connectivity

✅ **Database Models**
- `Listing` model - Stores all SimplyRETS listing data
- `Agent` model - Stores agent information (IDX compliance)
- `Office` model - Stores office information (IDX compliance)
- `AddressMatch` model - Tracks matches between listings and parcels

✅ **Address Matching Service** (`backend/app/services/address_matching.py`)
- Three matching strategies:
  1. Tax ID matching (highest confidence)
  2. Address matching (fuzzy matching)
  3. Geospatial matching (coordinates within parcel boundaries)
- Confidence scoring system

✅ **Import Script** (`backend/scripts/import_simplyrets.py`)
- Fetches listings from SimplyRETS API
- Imports/updates listings in database
- Automatically matches listings to parcels
- Handles agent and office data

## What You Need to Do

### Step 1: Create SimplyRETS Account

1. **Visit SimplyRETS Website**
   - Go to: https://simplyrets.com/
   - Click "Sign Up" or "Get Started"

2. **Choose Your Plan**
   - They offer a **development sandbox** (free) for testing
   - For production, you'll need a paid plan that includes SmartMLS access
   - **Important**: Make sure the plan includes access to SmartMLS (Connecticut MLS)

3. **Complete Registration**
   - Provide your business information
   - Verify your email
   - Wait for account approval (usually 1-2 business days)

### Step 2: Get Your API Credentials

Once your account is approved:

1. **Log into SimplyRETS Dashboard**
   - Navigate to: https://simplyrets.com/dashboard

2. **Find Your API Credentials**
   - Look for "API Credentials" or "API Keys" section
   - You'll get:
     - **Username** (API username)
     - **Password** (API password/token)
     - **Base URL** (usually `https://api.simplyrets.com`)

3. **Verify Sandbox Access**
   - SimplyRETS provides a development sandbox for testing
   - The sandbox has sample data (not real SmartMLS data)
   - Use this to test your integration before going live

### Step 3: Configure Your Environment

1. **Create/Update `.env` File**
   
   In your project root (or `backend/` directory), create/update `.env`:
   
   ```env
   # SimplyRETS API Configuration
   SIMPLYRETS_USERNAME=your_username_here
   SIMPLYRETS_PASSWORD=your_password_here
   SIMPLYRETS_BASE_URL=https://api.simplyrets.com
   SIMPLYRETS_TIMEOUT=30.0
   SIMPLYRETS_MAX_RETRIES=3
   SIMPLYRETS_RETRY_DELAY=1.0
   ```

2. **Update `backend/app/core/config.py`** (if needed)
   
   The config already reads from environment variables, so your `.env` file should work automatically.

3. **Test the Connection**
   
   ```bash
   cd backend
   python -c "from app.services.simplyrets import SimplyRETSService; import asyncio; service = SimplyRETSService(); result = asyncio.run(service.get_properties(limit=5)); print(f'Success! Found {len(result.get(\"properties\", []))} properties')"
   ```

### Step 4: Test with Development Sandbox

Before importing real data:

1. **Test API Health**
   ```bash
   cd backend
   python -c "from app.services.simplyrets import SimplyRETSService; import asyncio; service = SimplyRETSService(); result = asyncio.run(service._make_request('/health')); print(result)"
   ```

2. **Fetch Sample Properties**
   ```bash
   cd backend
   python -c "from app.services.simplyrets import SimplyRETSService; import asyncio; service = SimplyRETSService(); result = asyncio.run(service.get_properties(limit=10, state='CT')); print(f'Found {len(result.get(\"properties\", []))} properties')"
   ```

3. **Check Available Data**
   - Verify you can fetch properties
   - Check what fields are available
   - Ensure coordinates are present (needed for geospatial matching)

### Step 5: Import SimplyRETS Data

Once you've verified the connection works:

1. **Import Listings**
   ```bash
   cd backend
   python scripts/import_simplyrets.py --limit 100
   ```
   
   This will:
   - Fetch listings from SimplyRETS
   - Import them into your `listings` table
   - Automatically match them to parcels using address matching
   - Import agent and office data

2. **Import All Listings** (for full import)
   ```bash
   cd backend
   python scripts/import_simplyrets.py --limit 10000
   ```
   
   Note: SimplyRETS has rate limits, so large imports may take time.

3. **Check Import Results**
   ```bash
   cd backend
   python -c "from app.db import SessionLocal; from sqlalchemy import text; db = SessionLocal(); result = db.execute(text('SELECT COUNT(*) FROM listings;')); print(f'Total listings: {result.fetchone()[0]:,}'); db.close()"
   ```

4. **Delta Imports** (only update recent changes)
   ```bash
   cd backend
   # Use explicit since timestamp
   python scripts/import_simplyrets.py --since 2026-01-16T00:00:00

   # Or run in delta mode (uses last successful import time if available)
   python scripts/import_simplyrets.py --run-type delta
   ```

5. **Import Audit Health**
   - Import runs are logged to `import_audits`
   - Check import freshness:
     - `GET /health/mls`

### Step 6: Verify Address Matching

After importing listings, check how many were matched to parcels:

```bash
cd backend
python -c "from app.db import SessionLocal; from sqlalchemy import text; db = SessionLocal(); result = db.execute(text('SELECT COUNT(*) FROM address_matches;')); print(f'Matched listings: {result.fetchone()[0]:,}'); db.close()"
```

## Integration Workflow

Here's how the data flows:

```
SimplyRETS API
    ↓
SimplyRETSService (fetches listings)
    ↓
import_simplyrets.py (imports to database)
    ↓
Listing Model (stores in listings table)
    ↓
AddressMatchingService (matches to parcels)
    ↓
AddressMatch Model (tracks matches)
    ↓
Parcel Model (linked via foreign key)
```

## Important Notes

### IDX/SmartMLS Compliance

⚠️ **Critical**: SimplyRETS data comes with IDX (Internet Data Exchange) requirements:

1. **Attribution Required**
   - Must display "Data provided by SmartMLS" or similar
   - Must include agent/office information
   - Must include listing source/disclaimer

2. **Data Usage Restrictions**
   - Cannot store data indefinitely (check SimplyRETS terms)
   - Must refresh data regularly
   - Cannot redistribute raw MLS data

3. **Agent/Office Information**
   - We store this in `agents` and `offices` tables
   - Required for IDX compliance
   - Must be displayed with listings

### Rate Limits

SimplyRETS has rate limits:
- **Development Sandbox**: Usually 100 requests/hour
- **Production**: Varies by plan (check your dashboard)
- Our service includes retry logic with exponential backoff

### Data Refresh

Listings change frequently. You should:

1. **Set up a scheduled job** (cron/scheduler) to refresh listings daily
2. **Update existing listings** (our import script handles this via `ON CONFLICT`)
3. **Remove expired listings** (listings that are no longer active)

**Example cron (daily at 2am):**
```bash
0 2 * * * cd /path/to/smartmls-ai-app/backend && python scripts/import_simplyrets.py --run-type delta >> import_simplyrets.log 2>&1
```

### Testing Checklist

Before going to production:

- [ ] SimplyRETS account created and approved
- [ ] API credentials configured in `.env`
- [ ] Health check endpoint works
- [ ] Can fetch sample properties
- [ ] Import script runs successfully
- [ ] Listings appear in database
- [ ] Address matching works (check `address_matches` table)
- [ ] Agent/office data is imported
- [ ] IDX attribution is displayed (when building frontend)

## Next Steps After Integration

1. **Build API Endpoints** for frontend
   - `/api/properties` - Combined parcel + listing data
   - `/api/properties/{id}` - Single property with full details
   - `/api/search` - Search with filters

2. **Create Map Endpoints**
   - `/api/map/parcels` - GeoJSON for map display
   - `/api/map/listings` - Active listings with coordinates

3. **Set up Scheduled Imports**
   - Daily refresh of listings
   - Update expired/removed listings

4. **Build Frontend Components**
   - Property search with map
   - Listing details page
   - IDX attribution footer

## Troubleshooting

### "Authentication Failed"
- Check your username/password in `.env`
- Verify credentials in SimplyRETS dashboard
- Make sure account is approved

### "No properties returned"
- Check if you're using sandbox (has limited data)
- Verify state filter (try `state='CT'`)
- Check SimplyRETS dashboard for API status

### "Rate limit exceeded"
- Reduce import batch size
- Add delays between requests
- Check your plan's rate limits

### "Address matching not working"
- Verify listings have coordinates (`geo.lat`, `geo.lng`)
- Check that parcels have valid geometries
- Review `address_matches` table for confidence scores

## Resources

- **SimplyRETS Documentation**: https://simplyrets.com/docs
- **SimplyRETS Dashboard**: https://simplyrets.com/dashboard
- **SmartMLS**: https://www.smartmls.com/
- **IDX Compliance Guide**: Check SimplyRETS documentation

## Support

If you encounter issues:
1. Check SimplyRETS dashboard for API status
2. Review logs in `backend/` directory
3. Test with development sandbox first
4. Contact SimplyRETS support if API issues persist


