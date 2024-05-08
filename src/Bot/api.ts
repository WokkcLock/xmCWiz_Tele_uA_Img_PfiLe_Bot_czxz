import { Bot, session, CommandContext } from "grammy";
import DanbooruApi from "../utils/DanbooruApi.js";
import UserCacheManager from "../utils/User/UserCacheManager.js";
import { createConversation } from "@grammyjs/conversations";
import { CusCvClass, cvNames } from "./CusCv.js";
import CommandMw from "./Middleware.js";
import { Menu } from "@grammyjs/menu";


async function initBot(botToken: string) {
    const bot = new Bot<CusContext>(botToken);
    const dan = await DanbooruApi.Create();
    const ucMan = new UserCacheManager();
    const cvFunc = new CusCvClass(ucMan);
    const commandMw = new CommandMw(ucMan, dan);

    // 安装会话插件
    bot.use(session({
        initial: () => ({ tagKind: "" }),
    }));

    // 安装对话插件
    bot.use(createConversation(cvFunc.AddTags, cvNames.addTags));
    bot.use(createConversation(cvFunc.RmTags, cvNames.rmTags));
    bot.use(createConversation(cvFunc.PatchKind, cvNames.patchKind));

    // 安装中间件
    bot.command("add_tags", commandMw.AddTags);
    bot.command("rm_tags", commandMw.RemoveTags);
    bot.command("random", commandMw.Random);
    bot.command("add_kind", commandMw.AddKind);
    bot.command("rm_kind", commandMw.RemoveKind);
    bot.command("patch_kind", commandMw.PatchKind);
    bot.command("list_kinds", commandMw.ListKinds);
    bot.command("list_tags", commandMw.ListKindTags);
    bot.command("tag", commandMw.Tag);
    bot.command("id", commandMw.Id);

    // menu插件相关
    const setRatingMenu = new Menu<CusContext>("set_rating")
        .text("general", ctx => {
            dan.SetRating("g")
            ctx.reply("set rating to general");
        })
        .text("sensitive", ctx => {
            dan.SetRating("s")
            ctx.reply("set rating to sensitive");
        })
        .text("questionable", ctx => {
            dan.SetRating("q")
            ctx.reply("set rating to questionable");
        })
        .row()
        .text("explicit", ctx => {
            dan.SetRating("e")
            ctx.reply("set rating to explicit");
        })
        .text("disable", ctx => {
            dan.DisableRating();
            ctx.reply("rating has been disabled");
        });

    bot.use(setRatingMenu);
    bot.command("set_rating", async (ctx) => {
        let nowRating = dan.GetRating();
        if (nowRating == undefined) {
            nowRating = "disabled";
        }
        await ctx.reply(`*Now rating*: _${nowRating}_\n`,
            {
                reply_markup: setRatingMenu,
                parse_mode: "MarkdownV2",
            }
        );

    })
    return bot;

}

export { initBot };