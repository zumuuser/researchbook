-- Initial schema for ResearchBook

CREATE TABLE IF NOT EXISTS books (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    file_path   TEXT NOT NULL UNIQUE,
    total_pages INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS page_states (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id         INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    page_number     INTEGER NOT NULL,
    canvas_state    TEXT NOT NULL DEFAULT '{}',
    highlights      TEXT NOT NULL DEFAULT '[]',
    updated_at      INTEGER NOT NULL,
    UNIQUE(book_id, page_number)
);

CREATE TABLE IF NOT EXISTS app_meta (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);
