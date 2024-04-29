import BetterSqlite3, { Database } from "better-sqlite3";
import { LogLevel, generateSingleLevelLog } from "../LevelLog.js";
import { tableName, sqls } from "./PreDefine.js";
import CryptoTool from "./CryptoTool.js";
import fs from 'fs';

class SqlApi {
    private static db: Database | undefined;
    private static getInstance() {
        if (SqlApi.db === undefined) {
            if (!fs.existsSync("private")) {
                fs.mkdirSync("private");
            }
            SqlApi.db = new BetterSqlite3("private/sql.db", {
                verbose: generateSingleLevelLog(LogLevel.sql),
            });
            SqlApi.db.exec(sqls.createTable);
        }
        return SqlApi.db;
    };

    static async update(chatId: string, content: string) {
        const db = SqlApi.getInstance();
        const hashStr = await CryptoTool.hash(chatId);
        // 检测hashStr是否存在
        let stmt = db.prepare(`SELECT * FROM ${tableName} WHERE hash = ?`);
        if (stmt.get(hashStr) == undefined) {
            stmt = db.prepare(`INSERT INTO ${tableName} (hash, content) VALUES (?, ?)`);
            stmt.run(hashStr, content);
        } else {
            stmt = db.prepare(`UPDATE ${tableName} SET content = ? WHERE hash = ?`);
            stmt.run(content, hashStr);
        }
    }
    static async get(chatId: string) {
        const db = SqlApi.getInstance();
        const hashStr = await CryptoTool.hash(chatId);
        const stmt = db.prepare(`SELECT content FROM ${tableName} WHERE hash = ?`);
        const ret = stmt.get(hashStr) as {content: string} | undefined;
        return ret == undefined ? undefined : ret.content;
    }
}

export default SqlApi;