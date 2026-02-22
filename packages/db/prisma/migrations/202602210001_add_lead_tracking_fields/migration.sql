-- Add lead tracking fields for contact history and price range

ALTER TABLE Lead ADD COLUMN lastContactAt DATETIME;
ALTER TABLE Lead ADD COLUMN nextActionAt DATETIME;
ALTER TABLE Lead ADD COLUMN nextActionNote TEXT;
ALTER TABLE Lead ADD COLUMN priceMin INTEGER;
ALTER TABLE Lead ADD COLUMN priceMax INTEGER;
