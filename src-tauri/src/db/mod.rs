use include_dir::{include_dir, Dir};
use rusqlite::{Connection, Result};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

static MIGRATIONS_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/src/db/migrations");

pub struct DbConn {
    pub conn: Mutex<Connection>,
}

impl DbConn {
    pub fn new(conn: Connection) -> Self {
        Self {
            conn: Mutex::new(conn),
        }
    }
}

pub fn init_db(app_handle: &AppHandle) -> Result<Connection> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
    let db_path = app_dir.join("researchbook.db");
    let conn = Connection::open(&db_path)?;

    // Run initial schema
    conn.execute_batch(include_str!("schema.sql"))?;

    // Run migrations
    run_migrations(&conn)?;

    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY)",
        [],
    )?;

    for entry in MIGRATIONS_DIR.files() {
        let name = entry.path().file_name().unwrap().to_str().unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM __migrations WHERE name = ?1",
            [name],
            |row| row.get(0),
        )?;

        if count == 0 {
            let sql = std::str::from_utf8(entry.contents()).unwrap();
            if let Err(e) = conn.execute_batch(sql) {
                eprintln!("Warning: migration {} failed: {}. Marking as applied.", name, e);
            }
            conn.execute(
                "INSERT INTO __migrations (name) VALUES (?1)",
                [name],
            )?;
        }
    }

    Ok(())
}
