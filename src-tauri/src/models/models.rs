use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Book {
    pub id: i64,
    pub title: String,
    pub file_path: String,
    pub total_pages: i32,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PageState {
    pub id: i64,
    pub book_id: i64,
    pub page_number: i32,
    pub canvas_state: String,
    pub highlights: String,
    pub updated_at: i64,
}
