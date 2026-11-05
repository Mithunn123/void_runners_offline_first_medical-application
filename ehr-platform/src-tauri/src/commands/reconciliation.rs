// Reconciliation CRUD operations

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ReconciliationAudit {
    pub id: Option<i64>,
    pub baseline_visit_id: i64,
    pub comparison_visit_id: i64,
    pub reconciled_at: Option<String>,
    pub reconciled_by: Option<String>,
    pub medications_added: Option<String>,
    pub medications_removed: Option<String>,
    pub medications_modified: Option<String>,
    pub medications_conflicting: Option<String>,
    pub conflicts_resolved: bool,
    pub resolution_notes: Option<String>,
    pub flagged_for_review: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[command]
pub async fn create_reconciliation(
    app: tauri::AppHandle,
    baseline_visit_id: i64,
    comparison_visit_id: i64,
    reconciled_by: Option<String>,
    medications_added: Option<String>,
    medications_removed: Option<String>,
    medications_modified: Option<String>,
    medications_conflicting: Option<String>,
    flagged_for_review: bool,
) -> Result<i64, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let result = db
        .execute(
            "INSERT INTO reconciliation_audit (baseline_visit_id, comparison_visit_id, reconciled_by, medications_added, medications_removed, medications_modified, medications_conflicting, flagged_for_review) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            &[
                &baseline_visit_id.to_string(),
                &comparison_visit_id.to_string(),
                &reconciled_by.unwrap_or_default(),
                &medications_added.unwrap_or_default(),
                &medications_removed.unwrap_or_default(),
                &medications_modified.unwrap_or_default(),
                &medications_conflicting.unwrap_or_default(),
                &(if flagged_for_review { "1" } else { "0" }),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.last_insert_id())
}

#[command]
pub async fn get_reconciliation(
    app: tauri::AppHandle,
    id: i64,
) -> Result<ReconciliationAudit, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let reconciliation: ReconciliationAudit = db
        .query_row(
            "SELECT id, baseline_visit_id, comparison_visit_id, reconciled_at, reconciled_by, medications_added, medications_removed, medications_modified, medications_conflicting, conflicts_resolved, resolution_notes, flagged_for_review, created_at, updated_at FROM reconciliation_audit WHERE id = ?1",
            &[&id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(reconciliation)
}

#[command]
pub async fn list_unresolved_reconciliations(
    app: tauri::AppHandle,
) -> Result<Vec<ReconciliationAudit>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let reconciliations: Vec<ReconciliationAudit> = db
        .query(
            "SELECT id, baseline_visit_id, comparison_visit_id, reconciled_at, reconciled_by, medications_added, medications_removed, medications_modified, medications_conflicting, conflicts_resolved, resolution_notes, flagged_for_review, created_at, updated_at FROM reconciliation_audit WHERE conflicts_resolved = 0 ORDER BY flagged_for_review DESC, created_at DESC",
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(reconciliations)
}

#[command]
pub async fn resolve_conflict(
    app: tauri::AppHandle,
    id: i64,
    resolution_notes: String,
    resolved_by: String,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute(
        "UPDATE reconciliation_audit SET conflicts_resolved = 1, resolution_notes = ?1, reconciled_by = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
        &[&resolution_notes, &resolved_by, &id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn flag_reconciliation_for_review(
    app: tauri::AppHandle,
    id: i64,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    db.execute(
        "UPDATE reconciliation_audit SET flagged_for_review = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
        &[&id],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
