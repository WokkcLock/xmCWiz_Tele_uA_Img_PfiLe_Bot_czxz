import { KindAlreadyExistError } from "../utils/CustomError.js";
import { ClientStateEnum, RatingEnum } from "../type/CustomEnum.js";
import db from "../db/index.js";
import { cacheControlTable, kindTable, userTable } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { cleanObjUndefined } from "../ToolFunc.js";

class SqlUpdateApi {

    static async UpdateUser(chatId: number, obj: Partial<typeof userTable.$inferSelect>) {
        // const filObj = cleanObjUndefined(obj) as Partial<typeof userTable.$inferSelect>;
        await db
            .update(userTable)
            .set(obj)
            .where(eq(userTable.chat_id, chatId));
    }

    static async UpdateKind(kindId: number, obj: Partial<typeof kindTable.$inferSelect>) {
        // const filObj = cleanObjUndefined(obj) as Partial<typeof kindTable.$inferSelect>;
        await db
            .update(kindTable)
            .set(obj)
            .where(eq(kindTable.id, kindId))
            .catch(_ => {
                // 新的kind name 已经存在
                throw new KindAlreadyExistError(obj.kind!);
            });
    }

    static async UpdateCacheControl(cacheControlId: number, obj: Partial<typeof cacheControlTable.$inferSelect>) {
        // const filObj = cleanObjUndefined(obj) as Partial<typeof cacheControlTable.$inferSelect>;
        await db
            .update(cacheControlTable)
            .set(obj)
            .where(eq(cacheControlTable.id, cacheControlId));
    }

    // static async UpdateUserRating(chatId: number, newRating: RatingEnum) {
    //     await db
    //         .update(userTable)
    //         .set({
    //             rating: newRating
    //         })
    //         .where(eq(userTable.chat_id, chatId));
    // }

    // // AKId: action_kind_id
    // static async UpdateUserStateAKId(chatId: number, newState: ClientStateEnum, newActionKindId: number) {
    //     await db
    //         .update(userTable)
    //         .set({
    //             state: newState,
    //             action_kind_id: newActionKindId,
    //         })
    //         .where(eq(userTable.chat_id, chatId));
    // }

    // static async UpdateKindName(kindId: number, newKindName: string) {
    //     await db
    //         .update(kindTable)
    //         .set({
    //             kind: newKindName,
    //         })
    //         .where(and(
    //             eq(kindTable.id, kindId),
    //         ))
    //         .returning({ id: kindTable.id })
    //         .catch(_ => {
    //             // 新的kind name 已经存在
    //             throw new KindAlreadyExistError(newKindName);
    //         });
    // }

}

export default SqlUpdateApi;