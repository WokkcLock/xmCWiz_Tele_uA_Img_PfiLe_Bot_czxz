import { Context, SessionFlavor } from "grammy";
import { type ConversationFlavor, type Conversation } from "@grammyjs/conversations";
import UserProfile from "../utils/User/UserProfile.js";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";

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

    interface CusSessionData {
        tagKind: string,
    }

    type CusContext = ParseModeFlavor<Context> & ConversationFlavor & SessionFlavor<CusSessionData>;
    type CusConversation = Conversation<CusContext>;


    type Rating = 'g' | 's' | 'q' | 'e';


}
