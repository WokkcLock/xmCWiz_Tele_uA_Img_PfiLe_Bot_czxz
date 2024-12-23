import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "fs";
import { generateSingleLevelLog, LogLevel } from "../utils/LevelLog";

let sqlUrl: string;
if (process.env.DB_URL == undefined) {
    if (!fs.existsSync("private")) {
        fs.mkdirSync("private");
    }
    sqlUrl = "private/sql.db";
} else {
    sqlUrl = process.env.DB_URL;
}


const db = drizzle({
    client: new Database(sqlUrl , { verbose: generateSingleLevelLog(LogLevel.sql) }),
});

db.$client.pragma("synchronous=OFF");    // 关闭写同步, 提升性能
db.$client.pragma("journal_mode=WAL");    // 开启WAL: Write Ahead Logging

export default db;