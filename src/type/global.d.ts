import { Context, SessionFlavor } from "grammy";
import UserProfile from "../utils/User/UserProfile.js";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import SqlApi from "../SqlApi/index.js";
import { LogLevel } from "../utils/LevelLog.js";
import { ClientStateEnum } from "./CustomEnum.js";

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
    type Rating = 'general' | 'sensitive' | 'questionable' | 'explicit' | undefined;

    interface CusSessionData {
        rating: Rating,
        state: ClientStateEnum,
        // 在仿对话过程中使用的数据
        actionKindId: number,
    }
     
    type CusContext = ParseModeFlavor<Context> & SessionFlavor<CusSessionData>;

    // SQl相关
    type SqlCountRet = { "COUNT(*)": number };
}
