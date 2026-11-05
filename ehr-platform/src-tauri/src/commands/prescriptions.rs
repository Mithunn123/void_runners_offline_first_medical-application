// Prescription CRUD operations

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct Prescription {
    pub id: Option<i64>,
    pub visit_id: i64,
    pub file_name: String,
    pub file_hash: String,
    pub file_uri: String,
    pub file_type: String,
    pub file_size_bytes: Option<i64>,
    pub ocr_text: Option<String>,
    pub ocr_metadata: Option<String>,
    pub uploaded_at: Option<String>,
}

#[command]
pub async fn upload_prescription(
    app: tauri::AppHandle,
    visit_id: i64,
    file_name: String,
    file_hash: String,
    file_uri: String,
    file_type: String,
    file_size_bytes: Option<i64>,
) -> Result<i64, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let result = db
        .execute(
            "INSERT INTO prescriptions (visit_id, file_name, file_hash, file_uri, file_type, file_size_bytes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            &[
                &visit_id.to_string(),
                &file_name,
                &file_hash,
                &file_uri,
                &file_type,
                &file_size_bytes.unwrap_or(0).to_string(),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.last_insert_id())
}

#[command]
pub async fn get_prescription(app: tauri::AppHandle, id: i64) -> Result<Prescription, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let prescription: Prescription = db
        .query_row(
            "SELECT id, visit_id, file_name, file_hash, file_uri, file_type, file_size_bytes, ocr_text, ocr_metadata, uploaded_at FROM prescriptions WHERE id = ?1",
            &[&id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(prescription)
}

#[command]
pub async fn list_prescriptions_for_visit(
    app: tauri::AppHandle,
    visit_id: i64,
) -> Result<Vec<Prescription>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let prescriptions: Vec<Prescription> = db
        .query(
            "SELECT id, visit_id, file_name, file_hash, file_uri, file_type, file_size_bytes, ocr_text, ocr_metadata, uploaded_at FROM prescriptions WHERE visit_id = ?1 ORDER BY uploaded_at DESC",
            &[&visit_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(prescriptions)
}

#[command]
pub async fn update_prescription_ocr(
    app: tauri::AppHandle,
    id: i64,
    ocr_text: String,
    ocr_metadata: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute(
        "UPDATE prescriptions SET ocr_text = ?1, ocr_metadata = ?2 WHERE id = ?3",
        &[&ocr_text, &ocr_metadata.unwrap_or_default(), &id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn delete_prescription(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute("DELETE FROM prescriptions WHERE id = ?1", &[&id])
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
