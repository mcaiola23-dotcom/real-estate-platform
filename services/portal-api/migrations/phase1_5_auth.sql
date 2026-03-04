-- Phase 1.5 Database Migration
-- Creates user_locations table and verifies other required tables exist

-- Create user_locations table for multiple saved addresses
CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    location_type VARCHAR(30) NOT NULL,  -- work, home, gym, school, daycare, partner_office, other
    label VARCHAR(100),                   -- Custom name like "Downtown Office"
    address VARCHAR(500) NOT NULL,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    commute_mode VARCHAR(20) DEFAULT 'driving',  -- driving, transit, bicycling, walking
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for user_locations
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_type ON user_locations(location_type);

-- Verify saved_searches table exists (should already be created, this is idempotent)
CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    filters JSONB NOT NULL,
    ai_query VARCHAR(500),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- Verify user_alerts table exists
CREATE TABLE IF NOT EXISTS user_alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    alert_criteria TEXT NOT NULL,  -- JSON string of search filters
    frequency VARCHAR(20) NOT NULL DEFAULT 'daily',  -- daily, weekly
    is_active BOOLEAN DEFAULT TRUE,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_active ON user_alerts(is_active);

-- Verify user_favorites table exists
CREATE TABLE IF NOT EXISTS user_favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(listing_id),
    parcel_id VARCHAR(50) REFERENCES parcels(parcel_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_listing ON user_favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_parcel ON user_favorites(parcel_id);
