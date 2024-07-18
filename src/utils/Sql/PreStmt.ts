import { Database, Statement } from "better-sqlite3";
import { tableName } from "./PreDefine.js";
class PreStmt {
    private _db: Database

    public InsertKind: Statement
    public InsertTag: Statement
    public InsertGeneral: Statement
    public InsertSensitive: Statement
    public InsertQuestionable: Statement
    public InsertExplicit: Statement
    public InsertNone: Statement
    public SelectKindStr: Statement
    public SelectKindIdCount: Statement
    public SelectKindIdCountRandomSingleNotEmpty: Statement
    public SelectTag: Statement
    public SelectTagSingleRandom: Statement
    public SelectGeneralCacheSingle: Statement
    public SelectSensitiveCacheSingle: Statement
    public SelectQuestionableCacheSingle: Statement
    public SelectExplicitCacheSingle: Statement
    public SelectDisableCacheSingle: Statement
    public CountKind: Statement
    public DeleteKindWithId: Statement
    public DeleteTagsWithKindId: Statement
    public DeleteTag: Statement
    public DeleteGeneralCache: Statement
    public DeleteSensitiveCache: Statement
    public DeleteQuestionableCache: Statement
    public DeleteExplicitCache: Statement
    public DeleteDisableCache: Statement
    public UpdateKindCountAddOffset: Statement
    public UpdateKindCountSubOffset: Statement


    constructor(inputDb: Database) {
        this._db = inputDb;
        this.InsertKind = this._db.prepare(
            `INSERT INTO ${tableName.kind} (chat_id, kind) VALUES (?, ?);`
        );
        this.InsertTag = this._db.prepare(
            `INSERT OR IGNORE INTO ${tableName.tag} (kind_id, tag) VALUES (?, ?);`
        );
        this.InsertGeneral = this._db.prepare(
            `INSERT INTO ${tableName.cache.g} (tag, md5, file_ext, image_id) VALUES (?, ?, ?, ?);`
        )
        this.InsertSensitive = this._db.prepare(
            `INSERT INTO ${tableName.cache.s} (tag, md5, file_ext, image_id) VALUES (?, ?, ?, ?);`
        );
        this.InsertQuestionable = this._db.prepare(
            `INSERT INTO ${tableName.cache.q} (tag, md5, file_ext, image_id) VALUES (?, ?, ?, ?);`
        );
        this.InsertExplicit = this._db.prepare(
            `INSERT INTO ${tableName.cache.e} (tag, md5, file_ext, image_id) VALUES (?, ?, ?, ?);`
        );
        this.InsertNone = this._db.prepare(
            `INSERT INTO ${tableName.cache.n} (tag, md5, file_ext, image_id) VALUES (?, ?, ?, ?);`
        );
        this.SelectGeneralCacheSingle = this._db.prepare(
            `SELECT id, md5, file_ext, image_id FROM ${tableName.cache.g} WHERE tag = ? LIMIT 1;`
        );
        this.SelectSensitiveCacheSingle = this._db.prepare(
            `SELECT id, md5, file_ext, image_id FROM ${tableName.cache.s} WHERE tag = ? LIMIT 1;`
        );
        this.SelectQuestionableCacheSingle = this._db.prepare(
            `SELECT id, md5, file_ext, image_id FROM ${tableName.cache.q} WHERE tag = ? LIMIT 1;`
        );
        this.SelectExplicitCacheSingle = this._db.prepare(
            `SELECT id, md5, file_ext, image_id FROM ${tableName.cache.e} WHERE tag = ? LIMIT 1;`
        );
        this.SelectDisableCacheSingle = this._db.prepare(
            `SELECT id, md5, file_ext, image_id FROM ${tableName.cache.n} WHERE tag = ? LIMIT 1;`
        );
        this.SelectKindStr = this._db.prepare(
            `SELECT kind FROM ${tableName.kind} WHERE chat_id = ?;`
        );
        this.SelectKindIdCount = this._db.prepare(
            `SELECT id, count FROM ${tableName.kind} WHERE chat_id = ? AND kind = ?;`
        );
        this.SelectKindIdCountRandomSingleNotEmpty = this._db.prepare(
            `SELECT id, count FROM ${tableName.kind} WHERE chat_id = ? AND count > 0 ORDER BY RANDOM() LIMIT 1;`
        );
        this.SelectTag = this._db.prepare(
            `SELECT tag FROM ${tableName.tag} WHERE kind_id = ?;`
        );
        this.SelectTagSingleRandom = this._db.prepare(
            `SELECT tag FROM ${tableName.tag} WHERE kind_id = ? ORDER BY RANDOM() LIMIT 1;`
        );
        this.CountKind = this._db.prepare(
            `SELECT COUNT(*) FROM ${tableName.kind} WHERE chat_id = ? AND kind = ?;`
        );
        this.DeleteKindWithId = this._db.prepare(
            `DELETE FROM ${tableName.kind} WHERE id = ?;`
        );
        this.DeleteTagsWithKindId = this._db.prepare(
            `DELETE FROM ${tableName.tag} WHERE kind_id = ?;`
        );
        this.DeleteTag = this._db.prepare(
        `DELETE FROM ${tableName.tag} WHERE kind_id = ? AND tag = ?;`
        );
        this.DeleteGeneralCache = this._db.prepare(
            `DELETE FROM ${tableName.cache.g} WHERE id = ?;`
        );
        this.DeleteSensitiveCache = this._db.prepare(
            `DELETE FROM ${tableName.cache.s} WHERE id = ?;`
        );
        this.DeleteQuestionableCache = this._db.prepare(
            `DELETE FROM ${tableName.cache.q} WHERE id = ?;`
        );
        this.DeleteExplicitCache = this._db.prepare(
            `DELETE FROM ${tableName.cache.e} WHERE id = ?;`
        );
        this.DeleteDisableCache = this._db.prepare(
            `DELETE FROM ${tableName.cache.n} WHERE id = ?;`
        );
        this.UpdateKindCountAddOffset = this._db.prepare(
            `UPDATE ${tableName.kind} SET count = count + ? WHERE id = ?;`
        );
        this.UpdateKindCountSubOffset = this._db.prepare(
            `UPDATE ${tableName.kind} SET count = count - ? WHERE id = ?;`
        );
    }
}

export default PreStmt;