import { KindAlreadyExistError, KindNameTooLongError, TagLenTooLongError } from "../utils/CustomError.js";
import { ImageFileExtEnum, RatingEnum } from "../type/CustomEnum.js";
import db from "../db/index.js";
import { kindTable, cacheTable, tagTabel, cacheControlTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { SqliteError } from "better-sqlite3";
import { shuffleCollection } from "../ToolFunc.js";
import { kindStrLenLimit, tagstrLenLimit } from "./Config.js";
class SqlInertApi {
    static async InsertKind(chatId: number, kind: string) {
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

    static async InsertTags(kindId: number, inputTagSet: Set<string>) {
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
            const addCount = (await tx.insert(tagTabel).values(inputList).onConflictDoNothing().returning({ id: tagTabel.id })).length;
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

    static async InsertCaches(chatId: number, rating: RatingEnum, tag: string, cacheList: { md5: string, file_ext: ImageFileExtEnum, image_id: number }[]) {
        await db.transaction(async (tx) => {
            const idList = (await tx.insert(cacheTable).values(cacheList).returning({ id: cacheTable.id })).map(item => item.id);
            const minId = idList[0];
            const maxId = idList[idList.length - 1];
            shuffleCollection(idList);      // 打乱idlist
            await tx.insert(cacheControlTable)
                .values({
                    tag,
                    rating,
                    user_id: chatId,
                    cache_start_id: minId,
                    cache_end_id: maxId,
                    shuffle_cache_list: idList,
                    shuffle_index: 0
                })
                .onConflictDoUpdate(
                    {
                        target: [cacheControlTable.rating, cacheControlTable.tag, cacheControlTable.user_id],
                        set: {
                            cache_start_id: minId,
                            cache_end_id: maxId,
                            shuffle_cache_list: idList,
                            shuffle_index: 0,
                        }
                    }
                );
        });
    }
}

export default SqlInertApi;