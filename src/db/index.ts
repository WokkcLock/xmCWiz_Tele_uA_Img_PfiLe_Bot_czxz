import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql/sqlite3";
import fs from "fs";
import { generateSingleLevelLog, LogLevel } from "../utils/LevelLog.js";
if (!fs.existsSync("private")) {
    fs.mkdirSync("private");
}


// const db = drizzle({
//     client: new Database(process.env.DB_URL == undefined ?  "private/sql.db" : process.env.DB_URL, 
//         { 
//             verbose: generateSingleLevelLog(LogLevel.sql) 
//         }
//     ),
// });
const db = drizzle({
    connection: {
        url: process.env.DB_URL!
    }
});
await db.$client.execute("PRAGMA synchronous = OFF;"); // 关闭写同步, 提升性能
await db.$client.execute("PRAGMA journal_mode=WAL;"); // 开启WAL: Write Ahead Logging

export default db;