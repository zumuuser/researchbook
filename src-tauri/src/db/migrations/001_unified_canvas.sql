-- Migration 001: Consolidate left_margin + right_margin into canvas_state

ALTER TABLE page_states ADD COLUMN canvas_state TEXT NOT NULL DEFAULT '{}';

-- Old margin data is discarded; tldraw will create a fresh default store
UPDATE page_states SET canvas_state = '{}' WHERE canvas_state = '{}';

ALTER TABLE page_states DROP COLUMN left_margin;
ALTER TABLE page_states DROP COLUMN right_margin;
