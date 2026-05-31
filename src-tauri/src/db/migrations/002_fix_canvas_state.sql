-- Migration 002: Reset any invalid canvas_state snapshots to empty
-- The previous migration may have created snapshots without schemaVersion,
-- which causes tldraw to crash. Resetting to '{}' lets tldraw create a valid default store.

UPDATE page_states SET canvas_state = '{}' WHERE canvas_state != '{}';
