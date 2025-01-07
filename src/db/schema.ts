import { integer, text, sqliteTable, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user",
    {
        chat_id: integer().primaryKey(),
        rating: integer().notNull(),
        state: integer().notNull(),
        action_kind_id: integer().notNull(),
    },
    _ => [],
);

export const kindTable = sqliteTable("kinds",
    {
        id: integer().primaryKey({ autoIncrement: true }),
        kind: text().notNull(),
        chat_id: integer(),     // 这里不需要和userTable建立外键联系, 因为 user_table中的项不会删除。
                                // 假如添加外键限制,会导致需要先/tag才能/add_kind的bug
        count: integer().notNull().default(0),
    },
    table => [
        index("idx_kinds_on_chatid").on(table.chat_id),
        uniqueIndex("unique_index_kinds_on_chatid_kind").on(table.chat_id, table.kind),
    ]
);

export const tagTabel = sqliteTable("tags",
    {
        id: integer().primaryKey({ autoIncrement: true }),
        kind_id: integer().references(() => kindTable.id, { onDelete: "cascade" }),
        tag: text().notNull(),
    },
    table => [
        index("idx_tags_on_kindid").on(table.kind_id),
        uniqueIndex("unique_idx_tags_on_kindid_tag").on(table.kind_id, table.tag),
    ]
);

export const cacheControlTable = sqliteTable("cache_control",
    {
        id: integer().primaryKey({ autoIncrement: true }),
        tag: text().notNull(),
        rating: integer().notNull(),
        user_id: integer().references(() => userTable.chat_id).notNull(),
        shuffle_cache_list: text({ mode: "json" }).$type<number[]>().notNull(),
        shuffle_index: integer().notNull(),
        cache_start_id: integer().notNull(),
        cache_end_id: integer().notNull(),
    },
    table => [
        uniqueIndex("unique_idx_cache_control_on_tag_rating").on(table.tag, table.rating, table.user_id),
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