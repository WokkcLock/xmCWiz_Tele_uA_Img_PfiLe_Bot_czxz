import BetterSqlite3, { Database, Statement } from "better-sqlite3";
import { LogLevel, generateSingleLevelLog } from "../utils/LevelLog.js";
import { createTable } from "./PreDefine.js";
import fs from 'fs';
import { AllHasNoTagError, KindAlreadyExistError, KindNameTooLongError, KindNotExistError } from "../utils/CustomError.js";
import PreStmt from "./PreStmt.js";
import { ImageFileExtEnum } from "../type/CustomEnum.js";
import db from "../db/index.js";
import { dCacheTable, eCacheTable, gCacheTable, kindTable, qCacheTable, sCacheTable, tagTabel } from "../db/schema.js";
import { and, eq, sql } from "drizzle-orm";

const kindStrLenLimit = 50;
const tagstrLenLimit = 50;

export class NewSqlApi {
    private static _instance: NewSqlApi | undefined

    private constructor() { }

    static GetInstance() {
        if (NewSqlApi._instance == undefined) {
            NewSqlApi._instance = new NewSqlApi();
        }
        return NewSqlApi._instance;
    }

    async InsertKind(chatId: number, kind: string) {
        if (kind.length > kindStrLenLimit) {
            throw new KindNameTooLongError(kind);
        }
        if (await db.$count(kindTable, eq(kindTable.kind, kind)) > 0) {

            // 已经存在
            throw new KindAlreadyExistError(kind);
        }
        await db.insert(kindTable).values({
            kind,
            chat_id: chatId
        });
    }

    async InsertTags(kindId: number, inputTagSet: Set<string>) {
        if (inputTagSet.size == 0) {
            return 0;
        }
        const inputList = [] as {
            kind_id: number,
            tag: string
        }[];
        for (const item of inputTagSet) {
            inputList.push({
                kind_id: kindId,
                tag: item,
            })
        }
        const addCount = (await db.insert(tagTabel).values(inputList).returning().onConflictDoNothing()).length;
        if (addCount != 0) {
            const { count: oldCount } = (await db
                .select({
                    count: kindTable.count
                })
                .from(kindTable)
                .where(eq(kindTable.id, kindId)))[0];
            await db
                .update(kindTable)
                .set({ count: oldCount + addCount })
                .where(eq(kindTable.id, kindId));
        }
        return addCount;
    }

    async InsertCache(rating: Rating, tag: string, cacheList: { md5: string, file_ext: ImageFileExtEnum, image_id: number }[]) {
        const newAry = cacheList.map(item => ({ ...item, tag }));
        db.transaction(async (tx) => {
            switch (rating) {
                case "general":
                    await db.insert(gCacheTable).values(newAry);
                    break;
                case "sensitive":
                    await db.insert(sCacheTable).values(newAry);
                    break;
                case "questionable":
                    await db.insert(qCacheTable).values(newAry);
                    break;
                case "explicit":
                    await db.insert(eCacheTable).values(newAry);
                    break;
                default:
                    await db.insert(dCacheTable).values(newAry);
            }
        })
    }

    async SelectKindIdCount(chatId: number, kind: string) {
        const ret = await db
            .select({
                id: kindTable.id,
                count: kindTable.count
            })
            .from(kindTable)
            .where(
                and(
                    eq(kindTable.chat_id, chatId),
                    eq(kindTable.kind, kind)
                )
            );
        if (ret.length == 0) {
            throw new KindNotExistError(kind);
        }
        return ret[0];
    }

    async SelectNotEmptyKindIdRandomSingle(chatId: number) {
        const ret = await db
            .select({
                id: kindTable.id,
                count: kindTable.count,
            })
            .from(kindTable)
            .where(eq(kindTable.chat_id, chatId))
            .orderBy(sql`RANDOM()`)
            .limit(1);
        if (ret.length == 0) {
            throw new AllHasNoTagError();
        }
        return ret;
    }

    async SelectAllKinds(chatId: number) {
        return (await db
            .select({
                kind: kindTable.kind
            })
            .from(kindTable)
            .where(eq(kindTable.chat_id, chatId)))
            .map(item => item.kind);
    }

    async SelectKindTagsWithKindId(kindId: number) {
        return (await db
            .select({
                tag: tagTabel.tag,
            })
            .from(tagTabel)
            .where(eq(tagTabel.kind_id, kindId))).map(item => item.tag);
    }

    async SelectKindTags(chatId: number, kind: string) {
        const { id: kindId, count } = await this.SelectKindIdCount(chatId, kind);
        if (count == 0) {
            return [] as string[];
        }
        return (await db
            .select({ tag: tagTabel.tag })
            .from(tagTabel)
            .where(eq(tagTabel.kind_id, kindId))).map(item => item.tag);

    }

    async SelectSingleRandomKindTag(notEmptyKindId: number) {
        const ret = await db
            .select({ tag: tagTabel.tag })
            .from(tagTabel)
            .where(eq(tagTabel.kind_id, notEmptyKindId))
            .orderBy(sql`RANDOM()`)
            .limit(1);
        return ret[0].tag;
    }

    async SelectSingleCache(rating: Rating, tag: string) {
        let cacheTable;
        switch (rating) {
            case "general":
                cacheTable = gCacheTable;
                break;
            case "sensitive":
                cacheTable = sCacheTable;
                break;
            case "questionable":
                cacheTable = qCacheTable;
                break;
            case "explicit":
                cacheTable = eCacheTable;
                break;
            default:
                cacheTable = dCacheTable;
        }
        // 选择
        const ret = await db.select().from(cacheTable).where(eq(cacheTable.tag, tag))
            .orderBy(sql`RANDOM()`).limit(1);
        if (ret.length == 0) {
            // cache不足
            return undefined;
        }
        const cacheItem = ret[0];
        // 删除
        await db.delete(cacheTable).where(eq(cacheTable.id, cacheItem.id));
        return {
            md5: cacheItem.md5,
            file_ext: cacheItem.file_ext,
            image_id: cacheItem.image_id,
        };
    }

    async DeleteKind(chatId: number, kind: string) {
        await db.delete(kindTable).where(and(
            eq(kindTable.chat_id, chatId),
            eq(kindTable.kind, kind),
        ));
    }

    async DeleteAllKindTags(kindId: number) {
        await db.delete(tagTabel).where(eq(tagTabel.kind_id, kindId));
    }

    async DeleteKindTags(kindId: number, inputTagSet: Set<string>) {
        if (inputTagSet.size == 0) {
            return 0;
        }
        let deleteCount = 0;
        await db.transaction(async (tx) => {
            for (const tag of inputTagSet) {
                deleteCount += (await tx.delete(tagTabel).where(eq(tagTabel.tag, tag)).returning()).length;
            }
            if (deleteCount != 0) {
                const { count: oldKindCount } = (await db.select({ count: kindTable.count })
                    .from(kindTable)
                    .where(eq(kindTable.id, kindId)))[0];

                await db.update(kindTable)
                    .set(
                        { count: oldKindCount + deleteCount }
                    )
                    .where(eq(kindTable.id, kindId));
            }
        })
        return deleteCount;
    }

}


class SqlApi {
    private static _instance: SqlApi | undefined = undefined;
    private _db: Database;
    private _preStmt: PreStmt;

    static GetInstance() {
        if (SqlApi._instance == undefined) {
            SqlApi._instance = new SqlApi();
        }
        return SqlApi._instance;
    }

    private constructor() {
        if (!fs.existsSync("private")) {
            fs.mkdirSync("private");
        }
        this._db = new BetterSqlite3("private/sql.db", {
            verbose: generateSingleLevelLog(LogLevel.sql),
        });

        createTable(this._db);
        this._db.pragma("synchronous=OFF");    // 关闭写同步, 提升性能
        this._db.pragma("journal_mode=WAL");    // 开启WAL: Write Ahead Logging
        this._preStmt = new PreStmt(this._db);
    }

    CloseDb() {
        this._db.close();
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
            case "general":
                stmt = this._preStmt.InsertGeneral;
                break;
            case "sensitive":
                stmt = this._preStmt.InsertSensitive;
                break;
            case "questionable":
                stmt = this._preStmt.InsertQuestionable;
                break;
            case "explicit":
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
            case "general":
                selectStmt = this._preStmt.SelectGeneralCacheSingle;
                rmStmt = this._preStmt.DeleteGeneralCache;
                break;
            case "sensitive":
                selectStmt = this._preStmt.SelectSensitiveCacheSingle;
                rmStmt = this._preStmt.DeleteSensitiveCache;
                break;
            case "questionable":
                selectStmt = this._preStmt.SelectQuestionableCacheSingle;
                rmStmt = this._preStmt.DeleteQuestionableCache;
                break;
            case "explicit":
                selectStmt = this._preStmt.SelectExplicitCacheSingle;
                rmStmt = this._preStmt.DeleteExplicitCache;
                break;
            default:
                selectStmt = this._preStmt.SelectDisableCacheSingle;
                rmStmt = this._preStmt.DeleteDisableCache;
        }
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