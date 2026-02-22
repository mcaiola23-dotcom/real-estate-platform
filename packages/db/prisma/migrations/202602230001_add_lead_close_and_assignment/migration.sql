-- Win/Loss Analysis + Lead Handoff/Reassignment fields
ALTER TABLE Lead ADD COLUMN closeReason TEXT;
ALTER TABLE Lead ADD COLUMN closeNotes TEXT;
ALTER TABLE Lead ADD COLUMN closedAt DATETIME;
ALTER TABLE Lead ADD COLUMN assignedTo TEXT;
ALTER TABLE Lead ADD COLUMN referredBy TEXT;
