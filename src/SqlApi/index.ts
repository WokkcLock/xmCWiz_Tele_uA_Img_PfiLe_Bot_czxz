import { EmptyKindError, KindAlreadyExistError, KindNameTooLongError, KindNotExistError, TagLenTooLongError } from "../utils/CustomError.js";
import { ClientStateEnum, ImageFileExtEnum, RatingEnum } from "../type/CustomEnum.js";
import db from "../db/index.js";
import { kindTable, cacheTable, tagTabel, cacheControlTable, userTable } from "../db/schema.js";
import { and, eq, lte, gte } from "drizzle-orm";
import { SqliteError } from "better-sqlite3";
import { levelLog, LogLevel } from "../utils/LevelLog.js";

const kindStrLenLimit = 50;
const tagstrLenLimit = 50;
const cacheTimePatience = 1;  // 缓存存在30分钟

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
        for (const tagItem of inputTagSet) {
            if (tagItem.length > tagstrLenLimit) {
                throw new TagLenTooLongError(tagItem);
            }
            inputList.push({
                kind_id: kindId,
                tag: tagItem,
            })
        }


        return await db.transaction(async tx => {
            const addCount = (await tx.insert(tagTabel).values(inputList).returning().onConflictDoNothing()).length;
            if (addCount != 0) {
                const { count: oldCount } = (await tx
                    .select({
                        count: kindTable.count
                    })
                    .from(kindTable)
                    .where(eq(kindTable.id, kindId)))[0];
                await tx
                    .update(kindTable)
                    .set({ count: oldCount + addCount })
                    .where(eq(kindTable.id, kindId));
            }
            return addCount;
        })
    }

    async InsertCaches(rating: RatingEnum, tag: string, cacheList: { md5: string, file_ext: ImageFileExtEnum, image_id: number }[]) {
        await db.transaction(async (tx) => {
            const idList = (await tx.insert(cacheTable).values(cacheList).returning({ id: cacheTable.id })).map(item => item.id);
            await tx.insert(cacheControlTable)
                .values({
                    tag,
                    rating,
                    start_index: idList[0],
                    end_index: idList[idList.length - 1],
                    update_time: Date.now(),
                })
                .onConflictDoUpdate(
                    {
                        target: [cacheControlTable.rating, cacheControlTable.tag],
                        set: {
                            start_index: idList[0],
                            end_index: idList[idList.length - 1],
                            update_time: Date.now(),
                        }
                    }
                );
        });
    }

    async SelectUser(chatId: number) {
        const ret = await db
            .select({
                rating: userTable.rating,
                actionKindId: userTable.action_kind_id,
                state: userTable.state,
            })
            .from(userTable)
            .where(eq(userTable.chat_id, chatId));
        if (ret.length > 0) {
            return ret[0];
        }

        // 不存在则插入
        await db.insert(userTable).values({
            chat_id: chatId,
            rating: RatingEnum.disable,
            state: ClientStateEnum.default,
            action_kind_id: -1,
        });
        return {
            rating: RatingEnum.disable,
            state: ClientStateEnum.default,
            actionKindId: -1,
        };

    }

    async SelectKindId(chatId: number, kind: string) {
        const ret = await db
            .select({
                id: kindTable.id
            })
            .from(kindTable)
            .where(and(
                eq(kindTable.chat_id, chatId),
                eq(kindTable.kind, kind)
            ));
        if (ret.length == 0) {
            throw new KindNotExistError(kind);
        }
        return ret[0].id;
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


    async SelectKindAllTags(chatId: number, kind: string) {
        const ret = await db.select({
            id: kindTable.id,
            count: kindTable.count
        }).from(kindTable).where(and(
            eq(kindTable.chat_id, chatId),
            eq(kindTable.kind, kind)
        ));
        if (ret.length == 0) {
            throw new KindNotExistError(kind);
        }
        const kindId = ret[0].id;
        const count = ret[0].count;
        if (count == 0) {
            return [] as string[];
        }
        return (await db
            .select({ tag: tagTabel.tag })
            .from(tagTabel)
            .where(eq(tagTabel.kind_id, kindId))).map(item => item.tag);
    }

    async SelectRandomKindTag(chatId: number, kind: string) {
        let ret1 = await db.select({
            id: kindTable.id,
            count: kindTable.count,
        })
            .from(kindTable)
            .where(
                and(
                    eq(kindTable.chat_id, chatId),
                    eq(kindTable.kind, kind),
                )
            );
        if (ret1.length == 0) {
            throw new KindNotExistError(kind);
        }
        const kindId = ret1[0].id;
        const tagCount = ret1[0].count;
        if (tagCount == 0) {
            throw new EmptyKindError(kind);
        }

        const ret2 = await db.select({
            id: tagTabel.id
        })
            .from(tagTabel)
            .where(
                eq(tagTabel.kind_id, kindId)
            );
        const randomId = ret2[Math.floor(Math.random() * ret2.length)].id;

        return (await db.select({
            tag: tagTabel.tag
        })
            .from(tagTabel)
            .where(
                eq(tagTabel.id, randomId)
            )
        )[0].tag;
    }


    async SelectCache(rating: RatingEnum, tag: string) {
        const ret1 = await db.select({
            startIndex: cacheControlTable.start_index,
            endIndex: cacheControlTable.end_index,
            updateTime: cacheControlTable.update_time,
        })
            .from(cacheControlTable)
            .where(and(
                eq(cacheControlTable.rating, rating),
                eq(cacheControlTable.tag, tag),
            ));
        if (ret1.length == 0) {
            return undefined;
        }
        const startIndex = ret1[0].startIndex;
        const endIndex = ret1[0].endIndex;
        const updateTime = ret1[0].updateTime;
        // 这里的整数代表的是毫秒

        if (Date.now() - updateTime > cacheTimePatience * 1000 * 60) {
            // 删除旧缓存, 返回undefined让上级函数更新缓存
            await db
                .delete(cacheTable)
                .where(
                    and(
                        lte(cacheTable.id, endIndex),
                        gte(cacheTable.id, startIndex),
                    )
                );
            return undefined;
        }

        const randomCacheId = Math.floor(Math.random() * (endIndex - startIndex + 1) + startIndex);

        return (await db.select({
            md5: cacheTable.md5,
            image_id: cacheTable.image_id,
            file_ext: cacheTable.file_ext
        })
            .from(cacheTable)
            .where(eq(
                cacheTable.id, randomCacheId
            )))[0];
    }

    async UpdateUserRating(chatId: number, newRating: RatingEnum) {
        await db
            .update(userTable)
            .set({
                rating: newRating
            })
            .where(eq(userTable.chat_id, chatId));
    }

    // AKId: action_kind_id
    async UpdateUserStateAKId(chatId: number, newState: ClientStateEnum, newActionKindId: number) {
        await db
            .update(userTable)
            .set({
                state: newState,
                action_kind_id: newActionKindId,
            })
            .where(eq(userTable.chat_id, chatId));
    }

    async UpdateKindName(kindId: number, newKindName: string) {
        await db
            .update(kindTable)
            .set({
                kind: newKindName,
            })
            .where(and(
                eq(kindTable.id, kindId),
            ))
            .returning({ id: kindTable.id })
            .catch(_ => {
                // 新的kind name 已经存在
                throw new KindAlreadyExistError(newKindName);
            });
    }

    async DeleteKind(chatId: number, kind: string) {
        await db.delete(kindTable).where(and(
            eq(kindTable.chat_id, chatId),
            eq(kindTable.kind, kind),
        ));
    }

    async DeleteAllKindTag(kindId: number) {
        await db.transaction(async tx => {
            await tx.delete(tagTabel).where(eq(tagTabel.kind_id, kindId));
        })
    }

    async DeleteKindTag(kindId: number, inputTagSet: Set<string>) {
        if (inputTagSet.size == 0) {
            return 0;
        }
        let deleteCount = 0;
        await db.transaction(async (tx) => {
            for (const tag of inputTagSet) {
                deleteCount += (await tx.delete(tagTabel).where(eq(tagTabel.tag, tag)).returning({ id: tagTabel.id })).length;
            }
            if (deleteCount != 0) {
                const { count: oldKindCount } = (await tx.select({ count: kindTable.count })
                    .from(kindTable)
                    .where(eq(kindTable.id, kindId)))[0];

                await tx.update(kindTable)
                    .set(
                        { count: oldKindCount - deleteCount }
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