import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { schema } from './schema.js';

let db: Database.Database | undefined;

export const initDB = (): Database.Database => {
  if (db) return db;
  db = new Database(config.dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(schema);
  const questionColumns = db.prepare('PRAGMA table_info(questions)').all() as { name: string }[];
  if (!questionColumns.some((column) => column.name === 'group_name')) db.exec('ALTER TABLE questions ADD COLUMN group_name TEXT');
  return db;
};

export const getDB = (): Database.Database => db ?? initDB();
