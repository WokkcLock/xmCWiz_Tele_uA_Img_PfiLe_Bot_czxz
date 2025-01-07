import { EmptyKindError, KindNotExistError } from "../utils/CustomError.js";
import { RatingEnum } from "../type/CustomEnum.js";
import db from "../db/index.js";
import { kindTable, cacheTable, tagTabel, cacheControlTable, userTable } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

class SqlSelectApi {
    static async SelectUser(chatId: number) {
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
        return undefined;
    }

    //     // 不存在则插入
    //     await db.insert(userTable).values({
    //         chat_id: chatId,
    //         rating: RatingEnum.disable,
    //         state: ClientStateEnum.default,
    //         action_kind_id: -1,
    //     });
    //     return {
    //         rating: RatingEnum.disable,
    //         state: ClientStateEnum.default,
    //         actionKindId: -1,
    //     };
    // }

    static async SelectKindId(chatId: number, kind: string) {
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


    static async SelectAllKinds(chatId: number) {
        return (await db
            .select({
                kind: kindTable.kind
            })
            .from(kindTable)
            .where(eq(kindTable.chat_id, chatId)))
            .map(item => item.kind);
    }


    static async SelectKindAllTags(chatId: number, kind: string) {
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

    static async SelectRandomKindTag(chatId: number, kind: string) {
        const ret1 = await db
            .select({
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

        const ret2 = await db
            .select({
                id: tagTabel.id
            })
            .from(tagTabel)
            .where(
                eq(tagTabel.kind_id, kindId)
            );
        const randomId = ret2[Math.floor(Math.random() * ret2.length)].id;

        return (await db
            .select({
                tag: tagTabel.tag
            })
            .from(tagTabel)
            .where(
                eq(tagTabel.id, randomId)
            )
        )[0].tag;
    }

    static async SelectCacheControl(chatId: number, rating: RatingEnum, tag: string) {
        const ret1 = await db
            .select({
                id: cacheControlTable.id,
                idList: cacheControlTable.shuffle_cache_list,
                index: cacheControlTable.shuffle_index,
                startId: cacheControlTable.cache_start_id,
                endId: cacheControlTable.cache_end_id,
            })
            .from(cacheControlTable)
            .where(and(
                eq(cacheControlTable.rating, rating),
                eq(cacheControlTable.tag, tag),
                eq(cacheControlTable.user_id, chatId),
            ));
        if (ret1.length == 0) {
            return undefined;
        }
        return ret1[0];
    }

    static async SelectCache(cacheId: number) {
        return (await db
            .select({
                md5: cacheTable.md5,
                image_id: cacheTable.image_id,
                file_ext: cacheTable.file_ext
            })
            .from(cacheTable)
            .where(eq(cacheTable.id, cacheId))
        )[0];
    }

}


export default SqlSelectApi;