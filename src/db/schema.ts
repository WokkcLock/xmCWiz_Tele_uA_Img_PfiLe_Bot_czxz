import { sql } from "drizzle-orm";
import { integer, text, sqliteTable, uniqueIndex, check, index } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user",
    {
        chat_id: integer().primaryKey(),
        rating: integer().notNull(),
        state: integer().notNull(),
        action_kind_id: integer().notNull(),
    },
    _ => [],
);

export const kindTable = sqliteTable("kind",
    {
        id: integer().primaryKey({ autoIncrement: true }),
        kind: text().notNull(),
        chat_id: integer().notNull(),
        count: integer().notNull().default(0),
    },
    table => [
        index("idx_kinds_on_chatid").on(table.chat_id),
        uniqueIndex("unique_index_kinds_on_chatid_kind").on(table.chat_id, table.kind),
    ]
);

export const tagTabel = sqliteTable("tag",
    {
        id: integer().primaryKey({ autoIncrement: true }),
        kind_id: integer().references(() => kindTable.id, { onDelete: "cascade" }),
        tag: text().notNull(),
    },
    table => [
        uniqueIndex("unique_idx_tags_on_kindid_tag").on(table.kind_id, table.tag),
    ]
);

export const cacheControlTable = sqliteTable("cache_control",
    {
        id: integer().primaryKey({ autoIncrement: true }),
        tag: text().notNull(),
        rating: integer().notNull(),
        update_time: integer().notNull(),
        start_index: integer().notNull(),
        end_index: integer().notNull(),
        // invalid_cache_list: text({ mode: "json" }).notNull().$type<number[]>().default(sql`[]`),
    },
    table => [
        uniqueIndex("unique_idx_cache_control_on_tag_rating").on(table.tag, table.rating),
    ]
);

export const cacheTable = sqliteTable("cache",
    {
        id: integer().primaryKey({ autoIncrement: true }),
        md5: text().notNull(),
        file_ext: integer().notNull(),
        image_id: integer().notNull(),
    },
    _ => []
);