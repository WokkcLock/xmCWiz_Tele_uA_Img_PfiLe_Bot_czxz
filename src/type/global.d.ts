import { Context, LazySessionFlavor } from "grammy";
import UserProfile from "../utils/User/UserProfile.js";
import type { ParseModeFlavor } from "@grammyjs/parse-mode";
import SqlApi from "../SqlApi/index.js";
import { LogLevel } from "../utils/LevelLog.js";
import { ClientStateEnum, RatingEnum } from "./CustomEnum.js";

declare global {
    type DanbooruParams = {
        tags?: string,       // tags
        limit?: number,     // 限制输出的数量
        login?: string,     // 以下两个是是否以登录姿态
        api_key?: string,
        random?: boolean,    // 是否开启随机默认不开启 
        page?: string | number, // id 查询或其他
    }


     
    type CusContext = ParseModeFlavor<Context>;

    // SQl相关
    type SqlCountRet = { "COUNT(*)": number };
}
