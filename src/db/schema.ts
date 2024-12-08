import { sql } from "drizzle-orm";
import { integer, text, sqliteTable, uniqueIndex, check, index } from "drizzle-orm/sqlite-core";

function generateCacheTable(tableName: string) {
    return sqliteTable(tableName, {
        id: integer().primaryKey({ autoIncrement: true }),
        tag: text().notNull(),
        md5: text().notNull(),
        file_ext: integer().notNull(),
        image_id: integer().notNull(),
    },
        table => {
            return {
                md5LenCheck: check(`${tableName}_md5_len_check`, sql`length(${table.md5}) = 32`),
                tagIndex: index(`idx_${tableName}_on_tag`).on(table.tag),
            }
        }
    )
}

export const kindTable = sqliteTable("kinds", {
    id: integer().primaryKey({ autoIncrement: true }),
    kind: text().notNull(),
    chat_id: integer().notNull(),
    count: integer().notNull().default(0),
},
    table => {
        return {
            chatIdIndex: index("idx_kinds_on_chatid").on(table.chat_id),
            chatIdKindIndex: index("index_kinds_on_chatid_kind").on(table.chat_id, table.kind)
        }
    }
);

export const tagTabel = sqliteTable("tags", {
    id: integer().primaryKey({ autoIncrement: true }),
    kind_id: integer().references(() => kindTable.id, { onDelete: "cascade" }),
    tag: text().notNull(),
},
    table => {
        return {
            kindIdTagUniqueIndex: uniqueIndex("unique_idx_tags_on_kindid_tag").on(table.kind_id, table.tag),
        }
    }
);

export const gCacheTable = generateCacheTable("general_cache");
export const sCacheTable = generateCacheTable("sensitive_cache");
export const qCacheTable = generateCacheTable("questionable_cache");
export const eCacheTable = generateCacheTable("explicit_cache");
export const dCacheTable = generateCacheTable("disable_cache");