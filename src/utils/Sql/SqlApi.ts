import BetterSqlite3, { Database, Statement } from "better-sqlite3";
import { LogLevel, generateSingleLevelLog } from "../LevelLog.js";
import { kindStrLenLimit, tableName, tagstrLenLimit } from "./PreDefine.js";
import fs from 'fs';
import { AllHasNoTagError, KindAlreadyExistError, KindNameTooLongError, KindNotExistError} from "../CustomError.js";
import PreStmt from "./PreStmt.js";
import { ImageFileExtEnum } from "../../type/CustomEnum.js";


class SqlApi {
    private _db: Database;
    private _preStmt: PreStmt;
    constructor() {
        if (!fs.existsSync("private")) {
            fs.mkdirSync("private");
        }
        this._db = new BetterSqlite3("private/sql.db", {
            verbose: generateSingleLevelLog(LogLevel.sql),
        });

        this.createTable();
        this._db.pragma("synchronous=OFF");    // 关闭写同步, 提升性能
        this._db.pragma("journal_mode=WAL");    // 开启WAL: Write Ahead Logging
        this._preStmt = new PreStmt(this._db);
    }

    private createTable() {
        // 建表
        this._db.exec(`
            CREATE TABLE IF NOT EXISTS ${tableName.kind} (
                id INTEGER PRIMARY KEY,
                kind NVARCHAR(${kindStrLenLimit}) NOT NULL,
                chat_id INTEGER NOT NULL, 
                count INTEGER NOT NULL DEFAULT 0,
                INDEX idx_${tableName.kind}_chat_id (chat_id)
            );
            CREATE TABLE IF NOT EXISTS ${tableName.tag} (
                id INTEGER PRIMARY KEY,
                kind_id INTEGER REFERENCES ${tableName.kind}(id) ON DELETE CASCADE,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                INDEX idx_${tableName.tag}_kind_id (kind_id),
                UNIQUE (kind_id, tag)
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.g} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL,
                INDEX idx_${tableName.cache.g}_tag (tag)
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.s} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL,
                INDEX idx_${tableName.cache.s}_tag (tag)
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.q} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL,
                INDEX idx_${tableName.cache.q}_tag (tag)
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.e} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL,
                INDEX idx_${tableName.cache.e}_tag (tag)
            );
            CREATE TABLE IF NOT EXISTS ${tableName.cache.n} (
                id INTEGER PRIMARY KEY,
                tag VARCHAR(${tagstrLenLimit}) NOT NULL,
                md5 CHAR(32) NOT NULL,
                file_ext INTEGER NOT NULL,
                image_id INTEGER NOT NULL,
                INDEX idx_${tableName.cache.n}_tag (tag)
            );
        `);
    }

    InsertKind(chatId: number, kind: string) {
        if (kind.length > kindStrLenLimit) {
            throw new KindNameTooLongError(kind);
        }
        const { "COUNT(*)": ret } = this._preStmt.CountKind.get(chatId, kind) as SqlCountRet;
        if (ret > 0) {
            // 已经存在
            throw new KindAlreadyExistError(kind);
        }
        this._preStmt.InsertKind.run(chatId, kind);
    }

    InsertTags(kindId: number, inputTagSet: Set<string>) {
        if (inputTagSet.size == 0) {
            return 0;
        }
        let addCount = 0;
        // 包裹在事务中执行, 提升性能
        this._db.transaction(() => {
            for (const tag of inputTagSet) {
                const stmtRet = this._preStmt.InsertTag.run(kindId, tag);
                addCount += stmtRet.changes;
            }
            if (addCount != 0) {
                this._preStmt.UpdateKindCountAddOffset.run(addCount, kindId)
            }
        })();
        return addCount;
    }

    InsertCache(rating: Rating, tag: string, cacheList: { md5: string, file_ext: ImageFileExtEnum, image_id: number }[]) {
        let stmt: Statement;
        switch (rating) {
            case "g":
                stmt = this._preStmt.InsertGeneral;
                break;
            case "s":
                stmt = this._preStmt.InsertSensitive;
                break;
            case "q":
                stmt = this._preStmt.InsertQuestionable;
                break;
            case "e":
                stmt = this._preStmt.InsertExplicit;
                break;
            default:
                stmt = this._preStmt.InsertNone;
        }
        this._db.transaction(() => {
            for (const cache of cacheList) {
                stmt.run(tag, cache.md5, cache.file_ext, cache.image_id);
            }
        })();
    }

    SelectKindIdCount(chatId: number, kind: string) {
        const ret = this._preStmt.SelectKindIdCount
            .get(chatId, kind) as { id: number, count: number } | undefined;
        if (ret == undefined) {
            throw new KindNotExistError(kind);
        }

        return ret;
    }

    SelectNotEmptyKindIdRandomSingle(chatId: number) {
        const ret = this._preStmt.SelectKindIdCountRandomSingleNotEmpty.get(chatId) as { id: number, count: number } | undefined;
        if (ret == undefined) {
            throw new AllHasNoTagError();
        }
        return ret;
    }

    SelectAllKinds(chatId: number) {
        return (this._preStmt.SelectKindStr.all(chatId) as { kind: string; }[]).map(item => item.kind);
    }

    SelectKindTagsWithKindId(kindId: number) {
        return (this._preStmt.SelectTag.all(kindId) as { tag: string; }[]).map(item => item.tag);
    }


    SelectKindTags(chatId: number, kind: string) {
        const { id: kindId, count } = this.SelectKindIdCount(chatId, kind);
        if (count == 0) {
            return [] as string[];
        }
        return (this._preStmt.SelectTag.all(kindId) as { tag: string; }[]).map(item => item.tag);
    }

    SelectSingleRandomKindTag(notEmptyKindId: number) {
        // kind其中是notEmpty的, 这里就不检查是否为undefined了
        const ret = this._preStmt.SelectTagSingleRandom.get(notEmptyKindId) as { tag: string; }; 
        return ret.tag;
    }

    SelectSingleCache(rating: Rating, tag: string) {
        let selectStmt: Statement;
        let rmStmt: Statement;
        switch (rating) {
            case "g":
                selectStmt = this._preStmt.SelectGeneralCacheSingle;
                rmStmt = this._preStmt.DeleteGeneralCache;
                break;
            case "s":
                selectStmt = this._preStmt.SelectSensitiveCacheSingle;
                rmStmt = this._preStmt.DeleteSensitiveCache;
                break;
            case "q":
                selectStmt = this._preStmt.SelectQuestionableCacheSingle;
                rmStmt = this._preStmt.DeleteQuestionableCache;
                break;
            case "e":
                selectStmt = this._preStmt.SelectExplicitCacheSingle;
                rmStmt = this._preStmt.DeleteExplicitCache;
                break;
            default:
                selectStmt = this._preStmt.SelectDisableCacheSingle;
                rmStmt = this._preStmt.DeleteDisableCache;
        }
        return this._db.transaction(() => {
            const sqlRet = selectStmt.get(tag) as { id: number, md5: string, file_ext: ImageFileExtEnum, image_id: number } | undefined;
            if (sqlRet == undefined) {
                // cache不足
                return undefined;
            }
            // 成功获取到cache
            // 删除该cache
            rmStmt.run(sqlRet.id);
            return {
                md5: sqlRet.md5,
                file_ext: sqlRet.file_ext,
                image_id: sqlRet.image_id
            }
        })();
        
    }

    DeleteKind(chatId: number, kind: string) {
        // 获取kind的id
        const { id: kindId } = this.SelectKindIdCount(chatId, kind);
        this._preStmt.DeleteKindWithId.run(kindId);
    }

    DeleteAllKindTags(kindId: number) {
        this._preStmt.DeleteTagsWithKindId.run(kindId);
    }

    DeleteKindTags(kindId: number, inputTagSet: Set<string>) {
        if (inputTagSet.size == 0) {
            return 0;
        }
        let deleteCount = 0;
        // 包裹在事务中执行, 提升性能
        this._db.transaction(() => {
            for (const tag of inputTagSet) {
                const stmtRet = this._preStmt.DeleteTag.run(kindId, tag);
                deleteCount += stmtRet.changes;
            }
            if (deleteCount != 0) {
                this._preStmt.UpdateKindCountSubOffset.run(deleteCount, kindId);
            }
        })();
        return deleteCount;
    }


}

export default SqlApi;