import { Context, SessionFlavor } from "grammy";
import { type ConversationFlavor, type Conversation } from "@grammyjs/conversations";
import UserProfile from "../utils/User/UserProfile.js";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import SqlApi from "../utils/Sql/SqlApi.js";
import { ImageFileExtEnum } from "./CustomEnum.js";
import { LogLevel } from "../utils/LevelLog.js";

declare global {
    type DanbooruParams = {
        tags?: string,       // tags
        limit?: number,     // 限制输出的数量
        login?: string,     // 以下两个是是否以登录姿态
        api_key?: string,
        random?: boolean,    // 是否开启随机默认不开启 
        page?: string | number, // id 查询或其他
    }

    type UserCacheItem = {
        profile: UserProfile,
        timer: NodeJS.Timeout,
        isWrited: boolean,
    }
    type Rating = 'g' | 's' | 'q' | 'e' | undefined;

    interface CusSessionData {
        rating: Rating,
        tagKind: string,
    }

    type CusContext = ParseModeFlavor<Context> & ConversationFlavor & SessionFlavor<CusSessionData>;
    type CusConversation = Conversation<CusContext>;

    // SQl相关
    type SqlCountRet = { "COUNT(*)": number };
}
