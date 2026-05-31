use crate::db::DbConn;
use crate::models::models::PageState;
use rusqlite::params;
use tauri::{command, State};

#[command]
pub async fn save_page_state(
    book_id: i64,
    page_number: i32,
    canvas_state: String,
    highlights: String,
    state: State<'_, DbConn>,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let updated_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "INSERT INTO page_states (book_id, page_number, canvas_state, highlights, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(book_id, page_number) DO UPDATE SET
             canvas_state = excluded.canvas_state,
             highlights = excluded.highlights,
             updated_at = excluded.updated_at",
        params![book_id, page_number, canvas_state, highlights, updated_at],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn load_page_state(
    book_id: i64,
    page_number: i32,
    state: State<'_, DbConn>,
) -> Result<PageState, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT id, book_id, page_number, canvas_state, highlights, updated_at
         FROM page_states WHERE book_id = ?1 AND page_number = ?2",
        params![book_id, page_number],
        |row| {
            Ok(PageState {
                id: row.get(0)?,
                book_id: row.get(1)?,
                page_number: row.get(2)?,
                canvas_state: row.get(3)?,
                highlights: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    );

    match result {
        Ok(page_state) => Ok(page_state),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(PageState {
            id: 0,
            book_id,
            page_number,
            canvas_state: "{}".to_string(),
            highlights: "[]".to_string(),
            updated_at: 0,
        }),
        Err(e) => Err(e.to_string()),
    }
}
