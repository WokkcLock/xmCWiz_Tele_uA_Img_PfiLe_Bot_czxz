import { AllHasNoTagError, KindAlreadyExistError, KindNameTooLongError, KindNotExistError } from "../utils/CustomError.js";
import { ImageFileExtEnum } from "../type/CustomEnum.js";
import db from "../db/index.js";
import { dCacheTable, eCacheTable, gCacheTable, kindTable, qCacheTable, sCacheTable, tagTabel } from "../db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { SqliteError } from "better-sqlite3";

const kindStrLenLimit = 50;
const tagstrLenLimit = 50;

class SqlApi {
    private static _instance: SqlApi | undefined

    private constructor() { }

    static GetInstance() {
        if (SqlApi._instance == undefined) {
            SqlApi._instance = new SqlApi();
        }
        return SqlApi._instance;
    }

    async InsertKind(chatId: number, kind: string) {
        if (kind.length > kindStrLenLimit) {
            throw new KindNameTooLongError(kind);
        }
        try {
            await db.insert(kindTable).values({
                kind,
                chat_id: chatId
            });
        } catch (err) {
            if (err instanceof SqliteError) {
                if (err.code == "SQLITE_CONSTRAINT_UNIQUE") {
                    // 处理过程
                    throw new KindAlreadyExistError(kind);
                }
            } else {
                throw err;
            }
        }
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
        return ret[0];
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

    CloseDb() {
        db.$client.close();
    }
}

export default SqlApi;