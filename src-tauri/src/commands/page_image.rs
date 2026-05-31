use std::path::PathBuf;
use tauri::{command, AppHandle, Manager};

fn get_page_image_path(app_handle: &AppHandle, book_id: i64, page_number: i32) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    app_dir
        .join("books")
        .join(book_id.to_string())
        .join("pages")
        .join(format!("{}.webp", page_number))
}

#[command]
pub async fn write_page_image(
    app_handle: AppHandle,
    book_id: i64,
    page_number: i32,
    image_data: Vec<u8>,
) -> Result<String, String> {
    let path = get_page_image_path(&app_handle, book_id, page_number);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, &image_data).map_err(|e| e.to_string())?;
    path.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid path".to_string())
}

#[command]
pub async fn get_page_image_path_command(
    app_handle: AppHandle,
    book_id: i64,
    page_number: i32,
) -> Result<Option<String>, String> {
    let path = get_page_image_path(&app_handle, book_id, page_number);
    if path.exists() {
        Ok(path.to_str().map(|s| s.to_string()))
    } else {
        Ok(None)
    }
}

#[command]
pub async fn read_page_image(
    app_handle: AppHandle,
    book_id: i64,
    page_number: i32,
) -> Result<Vec<u8>, String> {
    let path = get_page_image_path(&app_handle, book_id, page_number);
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[command]
pub async fn list_converted_pages(
    app_handle: AppHandle,
    book_id: i64,
) -> Result<Vec<i32>, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    let pages_dir = app_dir.join("books").join(book_id.to_string()).join("pages");
    if !pages_dir.exists() {
        return Ok(vec![]);
    }
    let mut pages = vec![];
    for entry in std::fs::read_dir(&pages_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.ends_with(".webp") {
            if let Ok(num) = name_str.trim_end_matches(".webp").parse::<i32>() {
                pages.push(num);
            }
        }
    }
    pages.sort();
    Ok(pages)
}
