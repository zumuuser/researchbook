use crate::db::DbConn;
use rusqlite::params;
use std::fs::File;
use std::io::Write;
use tauri::{command, State};

#[command]
pub async fn export_notes_json(
    book_id: i64,
    output_path: String,
    state: State<'_, DbConn>,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT page_number, canvas_state, highlights
             FROM page_states WHERE book_id = ?1 ORDER BY page_number",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![book_id], |row| {
            Ok((
                row.get::<_, i32>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut pages = vec![];
    for row in rows {
        let (page_number, canvas_state, highlights) = row.map_err(|e| e.to_string())?;
        pages.push(serde_json::json!({
            "page_number": page_number,
            "canvas_state": serde_json::from_str::<serde_json::Value>(&canvas_state).unwrap_or(serde_json::json!({})),
            "highlights": serde_json::from_str::<serde_json::Value>(&highlights).unwrap_or(serde_json::json!([])),
        }));
    }

    let book: (String, String, i32) = conn
        .query_row(
            "SELECT title, file_path, total_pages FROM books WHERE id = ?1",
            params![book_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    let export = serde_json::json!({
        "version": "0.1.0",
        "book": {
            "id": book_id,
            "title": book.0,
            "file_path": book.1,
            "total_pages": book.2,
        },
        "pages": pages,
    });

    let mut file = File::create(&output_path).map_err(|e| e.to_string())?;
    file.write_all(export.to_string().as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn export_annotated_pdf(
    _book_id: i64,
    _output_path: String,
    _state: State<'_, DbConn>,
) -> Result<(), String> {
    Err("Annotated PDF export not yet implemented".to_string())
}

#[command]
pub async fn read_pdf_file(file_path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&file_path).map_err(|e| e.to_string())
}
