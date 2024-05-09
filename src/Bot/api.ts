import { Bot, session } from "grammy";
import DanbooruApi from "../utils/DanbooruApi.js";
import UserCacheManager from "../utils/User/UserCacheManager.js";
import { createConversation, conversations } from "@grammyjs/conversations";
import { CusCvClass, cvNames } from "./CusCv.js";
import { CommandMw, CallbackMw } from "./Middleware.js";
import { Menu } from "@grammyjs/menu";

async function initBot(
    botToken: string,
    dan: DanbooruApi,
    ucMan: UserCacheManager,
) {
    const bot = new Bot<CusContext>(botToken);
    // const dan = await DanbooruApi.Create();
    // const ucMan = new UserCacheManager();
    const cvFunc = new CusCvClass(ucMan);
    const commandMw = new CommandMw(ucMan, dan);
    CallbackMw.setDanbooruApi(dan);

    // 安装会话插件
    bot.use(
        session({
            initial: () => ({ tagKind: "" }),
        }),
    );

    // 安装对话插件
    bot.use(conversations());

    // 安装对话
    bot.use(createConversation(cvFunc.AddTags.bind(cvFunc), cvNames.addTags));
    bot.use(createConversation(cvFunc.RmTags.bind(cvFunc), cvNames.rmTags));
    bot.use(
        createConversation(cvFunc.PatchKind.bind(cvFunc), cvNames.patchKind),
    );

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

    // callback_data
    CallbackMw.setBotCallbackDataDataHandle(bot);

    return bot;
}

export { initBot };
