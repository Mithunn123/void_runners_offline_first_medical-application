// Patient CRUD operations

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct Patient {
    pub id: Option<i64>,
    pub patient_id: String,
    pub name: String,
    pub date_of_birth: String,
    pub allergies: Option<String>,
    pub emergency_contact: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[command]
pub async fn create_patient(
    app: tauri::AppHandle,
    patient_id: String,
    name: String,
    date_of_birth: String,
    allergies: Option<String>,
    emergency_contact: Option<String>,
) -> Result<i64, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let result = db
        .execute(
            "INSERT INTO patients (patient_id, name, date_of_birth, allergies, emergency_contact) VALUES (?1, ?2, ?3, ?4, ?5)",
            &[&patient_id, &name, &date_of_birth, &allergies.unwrap_or_default(), &emergency_contact.unwrap_or_default()],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.last_insert_id())
}

#[command]
pub async fn get_patient(app: tauri::AppHandle, id: i64) -> Result<Patient, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let patient: Patient = db
        .query_row(
            "SELECT id, patient_id, name, date_of_birth, allergies, emergency_contact, created_at, updated_at FROM patients WHERE id = ?1",
            &[&id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(patient)
}

#[command]
pub async fn update_patient(
    app: tauri::AppHandle,
    id: i64,
    name: String,
    date_of_birth: String,
    allergies: Option<String>,
    emergency_contact: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute(
        "UPDATE patients SET name = ?1, date_of_birth = ?2, allergies = ?3, emergency_contact = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?5",
        &[&name, &date_of_birth, &allergies.unwrap_or_default(), &emergency_contact.unwrap_or_default(), &id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn list_patients(app: tauri::AppHandle) -> Result<Vec<Patient>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let patients: Vec<Patient> = db
        .query(
            "SELECT id, patient_id, name, date_of_birth, allergies, emergency_contact, created_at, updated_at FROM patients ORDER BY name",
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(patients)
}

#[command]
pub async fn delete_patient(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute("DELETE FROM patients WHERE id = ?1", &[&id])
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
