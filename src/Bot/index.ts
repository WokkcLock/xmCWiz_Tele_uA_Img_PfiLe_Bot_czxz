import { Bot, session } from "grammy";
import DanbooruApi from "../utils/DanbooruApi.js";
import UserCacheManager from "../utils/User/UserCacheManager.js";
import { createConversation } from "@grammyjs/conversations";
import { CusCvClass, cvNames } from "./CusCv.js";


async function initBot(botToken: string) {
    const bot = new Bot<CusContext>(botToken);
    const dan = await DanbooruApi.Create();
    const ucMan = new UserCacheManager();
    const cvFunc = new CusCvClass(ucMan);

    // 安装会话插件
    bot.use(session({
        initial: () => ({ tagKind: "" }),
    }));

    // 安装对话插件
    bot.use(createConversation(cvFunc.AddTags, cvNames.addTag));
}