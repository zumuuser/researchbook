use crate::db::DbConn;
use crate::models::models::Book;
use rusqlite::params;
use std::path::Path;
use tauri::{command, State};

#[command]
pub async fn import_book(file_path: String, state: State<'_, DbConn>) -> Result<Book, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled")
        .to_string();

    let total_pages = 1;

    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let created_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    conn.execute(
        "INSERT OR IGNORE INTO books (title, file_path, total_pages, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![&title, &file_path, total_pages, created_at],
    )
    .map_err(|e| e.to_string())?;

    let book = conn.query_row(
        "SELECT id, title, file_path, total_pages, created_at FROM books WHERE file_path = ?1",
        params![&file_path],
        |row| {
            Ok(Book {
                id: row.get(0)?,
                title: row.get(1)?,
                file_path: row.get(2)?,
                total_pages: row.get(3)?,
                created_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())?;

    Ok(book)
}

#[command]
pub async fn list_books(state: State<'_, DbConn>) -> Result<Vec<Book>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, file_path, total_pages, created_at FROM books ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let books = stmt
        .query_map([], |row| {
            Ok(Book {
                id: row.get(0)?,
                title: row.get(1)?,
                file_path: row.get(2)?,
                total_pages: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(books)
}

#[command]
pub async fn delete_book(book_id: i64, state: State<'_, DbConn>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM books WHERE id = ?1", params![book_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn update_book_pages(
    book_id: i64,
    total_pages: i32,
    state: State<'_, DbConn>,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE books SET total_pages = ?1 WHERE id = ?2",
        params![total_pages, book_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
