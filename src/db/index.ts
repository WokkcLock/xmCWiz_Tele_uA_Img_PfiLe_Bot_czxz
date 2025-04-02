import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql/sqlite3";
import SqlLogger from "./SqlLogger.js";
import { DefaultLogger } from 'drizzle-orm/logger';


const db = drizzle({
    connection: {
        url: process.env.DB_URL!
    },
    logger: new DefaultLogger({ writer: new SqlLogger()}),
});
await db.$client.execute("PRAGMA synchronous = OFF;"); // 关闭写同步, 提升性能
await db.$client.execute("PRAGMA journal_mode=WAL;"); // 开启WAL: Write Ahead Logging

export default db;