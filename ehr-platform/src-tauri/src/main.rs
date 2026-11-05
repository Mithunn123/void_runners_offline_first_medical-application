#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod commands;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize database on startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = initialize_database(&app_handle).await;
            });
            Ok(())
        })
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // Patient commands
            commands::create_patient,
            commands::get_patient,
            commands::update_patient,
            commands::list_patients,
            commands::delete_patient,
            // Visit commands
            commands::create_visit,
            commands::get_visit,
            commands::update_visit,
            commands::list_visits_for_patient,
            commands::delete_visit,
            // Prescription commands
            commands::upload_prescription,
            commands::get_prescription,
            commands::list_prescriptions_for_visit,
            commands::update_prescription_ocr,
            commands::delete_prescription,
            // Medication commands
            commands::create_medication,
            commands::get_medication,
            commands::update_medication,
            commands::update_medication_status,
            commands::list_medications_for_visit,
            commands::list_active_medications_for_patient,
            commands::delete_medication,
            // Reconciliation commands
            commands::create_reconciliation,
            commands::get_reconciliation,
            commands::list_unresolved_reconciliations,
            commands::resolve_conflict,
            commands::flag_reconciliation_for_review,
            // Audit log commands
            commands::log_action,
            commands::get_audit_log,
            commands::get_audit_log_for_entity,
            commands::filter_audit_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn initialize_database(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_sql::{Migration, MigrationKind};

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_initial_schema.sql"),
            kind: MigrationKind::Up,
        }
    ];

    let db = app.state::<tauri_plugin_sql::DbPool>();

    for migration in migrations {
        db.execute(migration.sql, &[])
            .await
            .map_err(|e| format!("Migration {} failed: {}", migration.version, e))?;
    }

    println!("✓ Database initialized successfully");
    Ok(())
}
