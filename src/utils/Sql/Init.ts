import Database from "better-sqlite3";
import { LogLevel, generateSingleLevelLog } from "../LevelLog";

const sqls = {
    createTable: `
        CREATE TABLE IF NOT EXISTS ''
        (id integer primary key, title, content TEXT)
    `,  // * sql语句无所谓前后的空格或者换行
}

const db1 = new Database("sql.db", {
    verbose: generateSingleLevelLog(LogLevel.sql),
});

