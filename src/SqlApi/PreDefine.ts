/*
 * @Author: Wizlec
 * @Date: 2024-07-19 03:07:05
 * @LastEditors: Wizlec
 * @LastEditTime: 2024-07-19 03:39:06
 * @FilePath: /xmCWiz_Tele_uA_Img_PfiLe_Bot_czxz/src/utils/Sql/PreDefine.ts
 * @Description: 
 */
import { Database } from "better-sqlite3";

const tableName =
{
    kind: "kinds",
    tag: "tags",
    cache: {
        g: "general_cache",
        s: "sensitive_cache",
        q: "questionable_cache",
        e: "explicit_cache",
        d: "disable_cache"
    },
}


const kindStrLenLimit = 50;
const tagstrLenLimit = 50;

function createTable(db: Database) {
    db.exec(`
            CREATE TABLE IF NOT EXISTS ${tableName.kind} (
                id INTEGER PRIMARY KEY,
                kind NVARCHAR(${kindStrLenLimit}) NOT NULL,
                chat_id INTEGER NOT NULL, 
                count INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS ${tableName.tag} (
                id INTEGER PRIMARY KEY,
                kind_id INTEGER REFERENCES ${tableName.kind}(id) ON DELETE CASCADE,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                UNIQUE (kind_id, tag)
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.g} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.s} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.q} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.e} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.d} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_${tableName.kind}_chat_id ON ${tableName.kind} (chat_id);
            CREATE INDEX IF NOT EXISTS idx_${tableName.kind}_chat_id_and_kind ON ${tableName.kind} (chat_id, kind);
            CREATE INDEX IF NOT EXISTS idx_${tableName.tag}_chat_id ON ${tableName.tag} (kind_id);
            CREATE INDEX IF NOT EXISTS idx_${tableName.cache.g}_chat_id ON ${tableName.cache.g} (tag);
            CREATE INDEX IF NOT EXISTS idx_${tableName.cache.s}_chat_id ON ${tableName.cache.s} (tag);
            CREATE INDEX IF NOT EXISTS idx_${tableName.cache.q}_chat_id ON ${tableName.cache.q} (tag);
            CREATE INDEX IF NOT EXISTS idx_${tableName.cache.e}_chat_id ON ${tableName.cache.e} (tag);
            CREATE INDEX IF NOT EXISTS idx_${tableName.cache.d}_chat_id ON ${tableName.cache.d} (tag);
        `);
}

export {
    tableName, 
    kindStrLenLimit, tagstrLenLimit,
    createTable
};


