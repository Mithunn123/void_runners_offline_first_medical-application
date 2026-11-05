// Medication CRUD operations

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct MedicationItem {
    pub id: Option<i64>,
    pub visit_id: i64,
    pub source_prescription_id: Option<i64>,
    pub medication_name: String,
    pub strength: Option<String>,
    pub dosage: String,
    pub frequency: String,
    pub route: Option<String>,
    pub duration: Option<String>,
    pub status: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub discontinuation_reason: Option<String>,
    pub prescriber_name: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[command]
pub async fn create_medication(
    app: tauri::AppHandle,
    visit_id: i64,
    source_prescription_id: Option<i64>,
    medication_name: String,
    strength: Option<String>,
    dosage: String,
    frequency: String,
    route: Option<String>,
    duration: Option<String>,
    status: String,
    start_date: Option<String>,
    end_date: Option<String>,
    prescriber_name: Option<String>,
) -> Result<i64, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let result = db
        .execute(
            "INSERT INTO medication_items (visit_id, source_prescription_id, medication_name, strength, dosage, frequency, route, duration, status, start_date, end_date, prescriber_name) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            &[
                &visit_id.to_string(),
                &source_prescription_id.map(|id| id.to_string()).unwrap_or_default(),
                &medication_name,
                &strength.unwrap_or_default(),
                &dosage,
                &frequency,
                &route.unwrap_or_default(),
                &duration.unwrap_or_default(),
                &status,
                &start_date.unwrap_or_default(),
                &end_date.unwrap_or_default(),
                &prescriber_name.unwrap_or_default(),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.last_insert_id())
}

#[command]
pub async fn get_medication(app: tauri::AppHandle, id: i64) -> Result<MedicationItem, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let medication: MedicationItem = db
        .query_row(
            "SELECT id, visit_id, source_prescription_id, medication_name, strength, dosage, frequency, route, duration, status, start_date, end_date, discontinuation_reason, prescriber_name, created_at, updated_at FROM medication_items WHERE id = ?1",
            &[&id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(medication)
}

#[command]
pub async fn update_medication(
    app: tauri::AppHandle,
    id: i64,
    medication_name: String,
    strength: Option<String>,
    dosage: String,
    frequency: String,
    route: Option<String>,
    duration: Option<String>,
    status: String,
    start_date: Option<String>,
    end_date: Option<String>,
    prescriber_name: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute(
        "UPDATE medication_items SET medication_name = ?1, strength = ?2, dosage = ?3, frequency = ?4, route = ?5, duration = ?6, status = ?7, start_date = ?8, end_date = ?9, prescriber_name = ?10, updated_at = CURRENT_TIMESTAMP WHERE id = ?11",
        &[
            &medication_name,
            &strength.unwrap_or_default(),
            &dosage,
            &frequency,
            &route.unwrap_or_default(),
            &duration.unwrap_or_default(),
            &status,
            &start_date.unwrap_or_default(),
            &end_date.unwrap_or_default(),
            &prescriber_name.unwrap_or_default(),
            &id.to_string(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn update_medication_status(
    app: tauri::AppHandle,
    id: i64,
    status: String,
    discontinuation_reason: Option<String>,
    end_date: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute(
        "UPDATE medication_items SET status = ?1, discontinuation_reason = ?2, end_date = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4",
        &[
            &status,
            &discontinuation_reason.unwrap_or_default(),
            &end_date.unwrap_or_default(),
            &id.to_string(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn list_medications_for_visit(
    app: tauri::AppHandle,
    visit_id: i64,
) -> Result<Vec<MedicationItem>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let medications: Vec<MedicationItem> = db
        .query(
            "SELECT id, visit_id, source_prescription_id, medication_name, strength, dosage, frequency, route, duration, status, start_date, end_date, discontinuation_reason, prescriber_name, created_at, updated_at FROM medication_items WHERE visit_id = ?1 ORDER BY medication_name",
            &[&visit_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(medications)
}

#[command]
pub async fn list_active_medications_for_patient(
    app: tauri::AppHandle,
    patient_id: i64,
) -> Result<Vec<MedicationItem>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let medications: Vec<MedicationItem> = db
        .query(
            "SELECT m.id, m.visit_id, m.source_prescription_id, m.medication_name, m.strength, m.dosage, m.frequency, m.route, m.duration, m.status, m.start_date, m.end_date, m.discontinuation_reason, m.prescriber_name, m.created_at, m.updated_at
             FROM medication_items m
             JOIN visits v ON m.visit_id = v.id
             WHERE v.patient_id = ?1 AND m.status = 'active'
             ORDER BY m.medication_name",
            &[&patient_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(medications)
}

#[command]
pub async fn delete_medication(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute("DELETE FROM medication_items WHERE id = ?1", &[&id])
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
