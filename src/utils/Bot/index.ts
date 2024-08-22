import { Bot, session } from "grammy";
import DanbooruApi from "../DanbooruApi.js";
import CommandMw from "./Middleware.js";
import { conversations, createConversation } from "@grammyjs/conversations";
import { hydrateReply } from "@grammyjs/parse-mode";
import { CustomConversations, cvNames } from "./CustomConversations.js";
import { levelLog, LogLevel } from "../LevelLog.js";

async function initBot(botToken: string) {
    const bot = new Bot<CusContext>(botToken);
    const dan = await DanbooruApi.Create();
    const commandMw = new CommandMw(dan);
    const cusCv = new CustomConversations();

    // 安装会话插件
    bot.use(session({
        initial(): CusSessionData {
            return {
                rating: undefined,
                tagKind: ""
            };
        },
    }));
    // 安装对话插件
    bot.use(conversations());

    // 安装格式化插件
    bot.use(hydrateReply);

    // 安装对话
    bot.use(createConversation(cusCv.AddTags.bind(cusCv), cvNames.addTags));
    bot.use(createConversation(cusCv.RmTags.bind(cusCv), cvNames.rmTags));
    bot.use(createConversation(cusCv.PatchKind.bind(cusCv), cvNames.patchKind));

    // 安装中间件
    bot.command("add_tags", commandMw.AddTags.bind(commandMw));
    bot.command("rm_tags", commandMw.RemoveTags.bind(commandMw));
    bot.command("random", commandMw.Random.bind(commandMw));
    bot.command("add_kind", commandMw.AddKind.bind(commandMw));
    bot.command("rm_kind", commandMw.RemoveKind.bind(commandMw));
    bot.command("patch_kind", commandMw.PatchKind.bind(commandMw));
    bot.command("list_kinds", commandMw.ListKinds.bind(commandMw));
    bot.command("list_tags", commandMw.ListKindTags.bind(commandMw));
    bot.command("tag", commandMw.Tag.bind(commandMw));
    bot.command("id", commandMw.Id.bind(commandMw));
    bot.command("start", commandMw.Start.bind(commandMw));
    bot.command("set_rating", commandMw.SetRating.bind(commandMw));

    // 对callback_data做处理
    bot.on("callback_query:data", async ctx => {
        const callbackData = ctx.callbackQuery.data;
        switch (callbackData) {
            case "general":
            case "sensitive":
            case "questionable":
            case "explicit":
                ctx.session.rating = (callbackData[0] as Rating);
                await ctx.answerCallbackQuery(
                    `The Rating has been set: ${callbackData}`,
                );
                // 处理 Option 4 的逻辑
                break;
            case "disable":
                ctx.session.rating = undefined;
                await ctx.answerCallbackQuery("The Rating has been disable");
                break;
            default:
                // 按理说不可能到这里
                levelLog(LogLevel.error, `unknown callback_data: ${callbackData}`);
                await ctx.answerCallbackQuery(); // 移除加载动画
                return;
        }
    });
    return bot;
}

export default initBot;