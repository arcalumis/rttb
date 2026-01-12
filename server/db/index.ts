import { Database } from "bun:sqlite";
import path from "node:path";
import { initializeSchema } from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "generations.db");

let db: Database | null = null;

export function getDb(): Database {
	if (!db) {
		db = new Database(DB_PATH, { create: true });
		db.exec("PRAGMA journal_mode = WAL");
		initializeSchema(db);
	}
	return db;
}

export function closeDb(): void {
	if (db) {
		db.close();
		db = null;
	}
}
