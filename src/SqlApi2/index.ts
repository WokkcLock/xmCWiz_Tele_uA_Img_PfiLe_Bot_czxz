import db from "../db/index.js";
import { KindNameTooLongError, KindAlreadyExistError } from "../utils/CustomError.js";
import { cacheControlTable, kindTable, tagTabel } from "../db/schema2.js";
import { SqliteError } from "better-sqlite3";
import { eq } from "drizzle-orm";
import { ImageFileExtEnum } from "../type/CustomEnum.js";


const kindStrLenLimit = 50;
const tagstrLenLimit = 50;

class SqlApi {
    private static _instance: SqlApi | undefined;

    private constructor() {}

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

    async InsertCache(cacheList: { md5: string, file_ext: ImageFileExtEnum, image_id: number }[]) {
        // db.select().from(cacheControlTable).wh
        // return db.transaction(async tx => {
        //     await tx.insert(cacheTabe).values(cacheList);
        // });
    }



}