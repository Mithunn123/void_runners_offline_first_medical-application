// Audit log operations

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: Option<i64>,
    pub event_type: String,
    pub entity_type: String,
    pub entity_id: i64,
    pub user_role: String,
    pub action: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub reason: Option<String>,
    pub logged_at: Option<String>,
}

#[command]
pub async fn log_action(
    app: tauri::AppHandle,
    event_type: String,
    entity_type: String,
    entity_id: i64,
    user_role: String,
    action: String,
    old_value: Option<String>,
    new_value: Option<String>,
    reason: Option<String>,
) -> Result<i64, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let result = db
        .execute(
            "INSERT INTO audit_log (event_type, entity_type, entity_id, user_role, action, old_value, new_value, reason) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            &[
                &event_type,
                &entity_type,
                &entity_id.to_string(),
                &user_role,
                &action,
                &old_value.unwrap_or_default(),
                &new_value.unwrap_or_default(),
                &reason.unwrap_or_default(),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.last_insert_id())
}

#[command]
pub async fn get_audit_log(
    app: tauri::AppHandle,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<AuditLog>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let limit_val = limit.unwrap_or(100);
    let offset_val = offset.unwrap_or(0);

    let logs: Vec<AuditLog> = db
        .query(
            "SELECT id, event_type, entity_type, entity_id, user_role, action, old_value, new_value, reason, logged_at FROM audit_log ORDER BY logged_at DESC LIMIT ?1 OFFSET ?2",
            &[&limit_val, &offset_val],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(logs)
}

#[command]
pub async fn get_audit_log_for_entity(
    app: tauri::AppHandle,
    entity_type: String,
    entity_id: i64,
) -> Result<Vec<AuditLog>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let logs: Vec<AuditLog> = db
        .query(
            "SELECT id, event_type, entity_type, entity_id, user_role, action, old_value, new_value, reason, logged_at FROM audit_log WHERE entity_type = ?1 AND entity_id = ?2 ORDER BY logged_at DESC",
            &[&entity_type, &entity_id],
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(logs)
}

#[command]
pub async fn filter_audit_log(
    app: tauri::AppHandle,
    user_role: Option<String>,
    entity_type: Option<String>,
    action: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<AuditLog>, String> {
    let db = app.state::<tauri_plugin_sql::DbPool>();

    let mut query = String::from("SELECT id, event_type, entity_type, entity_id, user_role, action, old_value, new_value, reason, logged_at FROM audit_log WHERE 1=1");
    let mut params: Vec<String> = Vec::new();

    if let Some(role) = user_role {
        query.push_str(" AND user_role = ?");
        params.push(role);
    }

    if let Some(etype) = entity_type {
        query.push_str(" AND entity_type = ?");
        params.push(etype);
    }

    if let Some(act) = action {
        query.push_str(" AND action = ?");
        params.push(act);
    }

    if let Some(start) = start_date {
        query.push_str(" AND logged_at >= ?");
        params.push(start);
    }

    if let Some(end) = end_date {
        query.push_str(" AND logged_at <= ?");
        params.push(end);
    }

    query.push_str(" ORDER BY logged_at DESC");

    let logs: Vec<AuditLog> = db
        .query(&query, params.iter().map(|s| s.as_str()).collect::<Vec<&str>>().as_slice())
        .await
        .map_err(|e| e.to_string())?;

    Ok(logs)
}
