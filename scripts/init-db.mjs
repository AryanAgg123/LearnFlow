import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function resolveDatabasePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL must use sqlite file: syntax.");
  }

  const rawPath = databaseUrl.slice(5);

  if (rawPath.startsWith("/")) {
    return rawPath.replace(/^\/([A-Za-z]:\/)/, "$1");
  }

  return path.resolve(process.cwd(), "prisma", rawPath);
}

const databasePath = resolveDatabasePath(process.env.DATABASE_URL);
const schemaPath = path.resolve(process.cwd(), "prisma", "init.sql");
const sql = fs.readFileSync(schemaPath, "utf8");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.exec(sql);
db.close();

console.log(`SQLite database initialized at ${databasePath}`);
