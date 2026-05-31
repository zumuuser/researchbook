use std::io::{Read, Seek};
use tauri::command;

#[command]
pub async fn get_file_size(file_path: String) -> Result<u64, String> {
    let meta = std::fs::metadata(&file_path).map_err(|e| e.to_string())?;
    Ok(meta.len())
}

#[command]
pub async fn read_pdf_chunk(
    file_path: String,
    begin: u64,
    end: u64,
) -> Result<Vec<u8>, String> {
    let mut file = std::fs::File::open(&file_path).map_err(|e| e.to_string())?;
    file.seek(std::io::SeekFrom::Start(begin))
        .map_err(|e| e.to_string())?;
    let len = (end - begin) as usize;
    let mut buf = vec![0u8; len];
    file.read_exact(&mut buf).map_err(|e| e.to_string())?;
    Ok(buf)
}
