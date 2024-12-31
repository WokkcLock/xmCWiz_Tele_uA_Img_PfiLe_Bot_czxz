import { Bot } from "grammy";
import { bold, fmt, hydrateReply } from "@grammyjs/parse-mode";
import { fileErrorLoger, levelLog, LogLevel } from "../utils/LevelLog.js";
import mainComposer from "./composers/mainComposer.js";
import { KindNotExistError, KindAlreadyExistError, EmptyKindError, TagFetchError, IdFetchError, TagLenTooLongError, KindNameTooLongError } from "../utils/CustomError.js";
import { SocksProxyAgent } from "socks-proxy-agent";

async function initBot(botToken: string, socksAgentUrl: string | undefined) {
    let bot;
    if (socksAgentUrl == undefined) {
        bot = new Bot<CusContext>(botToken);
    } else {
        bot = new Bot<CusContext>(botToken, {
            client: {
                baseFetchConfig: {
                    agent: new SocksProxyAgent(socksAgentUrl),
                    compress: true,
                }
            }
        })
    }

    // 安装格式化插件
    bot.use(hydrateReply);

    // 安装中间件
    bot.use(mainComposer);

    // 错误处理
    bot.catch(async err => {
        const error = err.error;
        const ctx = err.ctx;
        if (error instanceof KindNotExistError
            || error instanceof KindAlreadyExistError
            || error instanceof EmptyKindError
            || error instanceof KindAlreadyExistError
            || error instanceof TagLenTooLongError
            || error instanceof KindNameTooLongError
        ) {
            await ctx.replyFmt(fmt`${bold("Action fail")}, reason: ${error.message}`);
        } 
        else if (error instanceof TagFetchError
            || error instanceof IdFetchError
        ) {
            await ctx.reply(error.message);
        } else {
            // 未知错误
            levelLog(LogLevel.error, error);
            fileErrorLoger.error(error);
            await ctx.replyFmt(fmt`${bold("Unexpected Fail")}`);
        }
    });

    return bot;

}

export { initBot };