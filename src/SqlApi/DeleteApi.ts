import db from "../db/index.js";
import { cacheTable, kindTable, tagTabel } from "../db/schema.js";
import { and, eq, lte, gte } from "drizzle-orm";

class SqlDeleteApi {

    static async DeleteKind(chatId: number, kind: string) {
        await db.delete(kindTable).where(and(
            eq(kindTable.chat_id, chatId),
            eq(kindTable.kind, kind),
        ));
    }

    static async DeleteAllKindTag(kindId: number) {
        await db.transaction(async tx => {
            await tx.delete(tagTabel).where(eq(tagTabel.kind_id, kindId));
        })
    }

    static async DeleteKindTag(kindId: number, inputTagSet: Set<string>) {
        if (inputTagSet.size == 0) {
            return 0;
        }
        let deleteCount = 0;
        await db.transaction(async (tx) => {
            for (const tag of inputTagSet) {
                deleteCount += (await tx
                    .delete(tagTabel)
                    .where(and(
                        eq(tagTabel.tag, tag),
                        eq(tagTabel.kind_id, kindId)
                    ))
                    .returning({ id: tagTabel.id })
                ).length;
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

    static async DeleteCache(startId: number, endId: number) {
        await db
        .delete(cacheTable)    
        .where(and(
            lte(cacheTable.id, endId),
            gte(cacheTable.id, startId),
        ))
    }
}

export default SqlDeleteApi;