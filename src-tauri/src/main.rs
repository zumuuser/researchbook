mod commands;
mod db;
mod models;

use commands::book::{delete_book, import_book, list_books, update_book_pages};
use commands::export::{export_annotated_pdf, export_notes_json, read_pdf_file};
use commands::page_image::{get_page_image_path_command, list_converted_pages, read_page_image, write_page_image};
use commands::pdf_chunk::{get_file_size, read_pdf_chunk};
use commands::page::{load_page_state, save_page_state};
use db::{init_db, DbConn};
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let conn = init_db(&app.handle())?;
            app.manage(DbConn::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            import_book,
            list_books,
            delete_book,
            update_book_pages,
            save_page_state,
            load_page_state,
            export_notes_json,
            export_annotated_pdf,
            read_pdf_file,
            write_page_image,
            get_page_image_path_command,
            list_converted_pages,
            read_page_image,
            get_file_size,
            read_pdf_chunk,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
