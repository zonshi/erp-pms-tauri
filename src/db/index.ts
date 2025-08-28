import Database from '@tauri-apps/plugin-sql';

let database: Database | null = null;

export async function getDatabase() {
  if (!database) {
    database = await Database.load('sqlite:erp.db');
  }
  return database;
}