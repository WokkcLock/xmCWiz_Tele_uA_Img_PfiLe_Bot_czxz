import "dotenv/config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "fs";
import { generateSingleLevelLog, LogLevel } from "../utils/LevelLog.js";
if (!fs.existsSync("private")) {
    fs.mkdirSync("private");
}


const db = drizzle({
    client: new Database(process.env.DB_URL == undefined ?  "private/sql.db" : process.env.DB_URL, 
        { 
            verbose: generateSingleLevelLog(LogLevel.sql) 
        }
    ),
});

db.$client.pragma("synchronous=OFF");    // 关闭写同步, 提升性能
db.$client.pragma("journal_mode=WAL");    // 开启WAL: Write Ahead Logging

export default db;