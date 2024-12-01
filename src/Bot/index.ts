import { Bot, session } from "grammy";
import { bold, fmt, hydrateReply } from "@grammyjs/parse-mode";
import { fileErrorLoger, levelLog, LogLevel } from "../utils/LevelLog.js";
import mainComposer from "./composers/mainComposer.js";
import { KindNotExistError, KindAlreadyExistError, EmptyKindError, AllHasNoTagError, ParamNotExistError, TagFetchError } from "../utils/CustomError.js";
import { ClientStateEnum } from "../type/CustomEnum.js";
import { freeStorage } from "@grammyjs/storage-free";

async function initBot(botToken: string) {
    const bot = new Bot<CusContext>(botToken);
    // 安装会话插件
    bot.use(session({
        initial(): CusSessionData {
            return {
                rating: undefined,
                state: ClientStateEnum.default,
                actionKindId: -1,
            };
        },
        storage: freeStorage<CusSessionData>(botToken)
    }));

    // 安装格式化插件
    bot.use(hydrateReply);

    // 安装中间件
    bot.use(mainComposer);

    // 错误处理
    bot.catch(err => {
        const error = err.error;
        const ctx = err.ctx;
        if (error instanceof KindNotExistError
            || error instanceof KindAlreadyExistError
            || error instanceof EmptyKindError
            || error instanceof AllHasNoTagError
            || error instanceof KindAlreadyExistError
        ) {
            ctx.replyFmt(fmt`${bold("Action fail")}: ${error.message}`);
        } else if (error instanceof ParamNotExistError) {
            ctx.replyFmt(fmt`the command need the param:  <${bold(error.message)}>`);
        }
        else if (error instanceof TagFetchError) {
            ctx.replyFmt(fmt`${bold("Action fail")}: ${error.message}`);
        } else {
            // 未知错误
            levelLog(LogLevel.error, error);
            fileErrorLoger.error(error);
            ctx.replyFmt(fmt`${bold("Unexpected Fail")}`);
        }
    });

    return bot;

}

export { initBot };