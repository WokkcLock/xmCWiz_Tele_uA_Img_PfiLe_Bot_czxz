import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "fs";

if (!fs.existsSync("private")) {
    fs.mkdirSync("private");
}

const db = drizzle({
    client: new Database("private/sql2.db"),
});

export default db;
