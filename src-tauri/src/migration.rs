use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        // Initial migration to create basic tables
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("migrations/1_create_initial_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_initial_data",
            sql: include_str!("migrations/2_create_initial_data.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
