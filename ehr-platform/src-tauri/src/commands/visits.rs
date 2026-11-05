// Visit CRUD operations

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct Visit {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub visit_date: String,
    pub facility_name: String,
    pub doctor_name: String,
    pub visit_type: Option<String>,
    pub clinical_notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[command]
pub async fn create_visit(
    app: tauri::AppHandle,
    patient_id: i64,
    visit_date: String,
    facility_name: String,
    doctor_name: String,
    visit_type: Option<String>,
    clinical_notes: Option<String>,
) -> Result<i64, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let result = db
        .execute(
            "INSERT INTO visits (patient_id, visit_date, facility_name, doctor_name, visit_type, clinical_notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            &[
                &patient_id.to_string(),
                &visit_date,
                &facility_name,
                &doctor_name,
                &visit_type.unwrap_or_default(),
                &clinical_notes.unwrap_or_default(),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.last_insert_id())
}

#[command]
pub async fn get_visit(app: tauri::AppHandle, id: i64) -> Result<Visit, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let visit: Visit = db
        .query_row(
            "SELECT id, patient_id, visit_date, facility_name, doctor_name, visit_type, clinical_notes, created_at, updated_at FROM visits WHERE id = ?1",
            &[&id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(visit)
}

#[command]
pub async fn update_visit(
    app: tauri::AppHandle,
    id: i64,
    visit_date: String,
    facility_name: String,
    doctor_name: String,
    visit_type: Option<String>,
    clinical_notes: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute(
        "UPDATE visits SET visit_date = ?1, facility_name = ?2, doctor_name = ?3, visit_type = ?4, clinical_notes = ?5, updated_at = CURRENT_TIMESTAMP WHERE id = ?6",
        &[
            &visit_date,
            &facility_name,
            &doctor_name,
            &visit_type.unwrap_or_default(),
            &clinical_notes.unwrap_or_default(),
            &id.to_string(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn list_visits_for_patient(
    app: tauri::AppHandle,
    patient_id: i64,
) -> Result<Vec<Visit>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let visits: Vec<Visit> = db
        .query(
            "SELECT id, patient_id, visit_date, facility_name, doctor_name, visit_type, clinical_notes, created_at, updated_at FROM visits WHERE patient_id = ?1 ORDER BY visit_date DESC",
            &[&patient_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(visits)
}

#[command]
pub async fn delete_visit(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute("DELETE FROM visits WHERE id = ?1", &[&id])
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
