import { Composer } from "grammy";
import { InlineKeyboard } from "grammy";
import { fmt, bold, italic, code } from "@grammyjs/parse-mode";
import { ParamNotExistError } from "../../utils/CustomError.js";
import { ReservedApi } from "../../utils/Helper/ReservedWord.js";
import { cvNames } from "../CustomConversations.js";
import SqlApi from "../../SqlApi/index.js";
import { levelLog, LogLevel } from "../../utils/LevelLog.js";

const sql = SqlApi.GetInstance();
const controlComposer = new Composer<CusContext>();

controlComposer.command("set_rating", ctx => {
    const inlineKeyboard = new InlineKeyboard()
        .text("general")
        .text("sensitive")
        .text("questionable")
        .row()
        .text("explicit")
        .text("disable");

    if (ctx.session.rating == undefined) {
        ctx.replyFmt(
            fmt`you haven't set rating, you can set it by click the button below.`,
            {
                reply_markup: inlineKeyboard,
            },
        );
        return;
    }
    ctx.replyFmt(
        fmt`${bold("Now rating")}: ${italic(ctx.session.rating)}\nyou can change rating by click the button below.`,
        {
            reply_markup: inlineKeyboard,
        },
    );
});

controlComposer.command("list_kinds", ctx => {
    const allKinds = sql.SelectAllKinds(ctx.chat.id);
    if (allKinds.length == 0) {
        ctx.reply(
            "there is still no kind, you can use /add_kind to add a kind",
        );
        return;
    }
    ctx.replyFmt(fmt`${allKinds.map(kind => code(kind)).join(" ")}`);
});

controlComposer.command("list_tags", ctx => {
    const kind = ctx.match;
    if (kind === "") {
        throw new ParamNotExistError("kind");
    }
    const tags = sql.SelectKindTags(ctx.chat.id, kind);
    if (tags.length == 0) {
        ctx.replyFmt(
            fmt`there is still no tags in ${bold(kind)}, you can use /add_tags to add tags`,
        );
        return;
    }
    ctx.replyFmt(
        fmt`${bold("[Kind]")}:  ${code(kind)}\n${bold("[tags]")}:  ${tags.map(tag => code(tag)).join(" ")}`
    );
});

controlComposer.command("add_kind", ctx => {
    const kind = ctx.match;
    if (kind === "") {
        throw new ParamNotExistError("kind");
    }
    if (ReservedApi.isReservedWord(kind)) {
        ctx.replyFmt(
            fmt`Can't use word ${code(kind)}, because it's a reserve word, please change`,
        );
        return;
    }
    sql.InsertKind(ctx.chat.id, kind);
    ctx.replyFmt(`Add kind: ${code(kind)}`);
});

controlComposer.command("rm_kind", ctx => {
    if (ctx.match === "") {
        throw new ParamNotExistError("kind");
    }
    sql.DeleteKind(ctx.chat.id, ctx.match);
    ctx.replyFmt(fmt`Remove kind: ${code(ctx.match)}`);
});

controlComposer.command("patch_kind", async (ctx) => {
    if (ctx.match === "") {
        throw new ParamNotExistError("kind");
    }
    ctx.session.tagKind = ctx.match;
    await ctx.conversation.enter(cvNames.patchKind);
});


controlComposer.command("add_tags", async (ctx) => {
    if (ctx.match === "") {
        throw new ParamNotExistError("kind");
    }
    ctx.session.tagKind = ctx.match;
    await ctx.conversation.enter(cvNames.addTags);
})

controlComposer.command("rm_tags", async (ctx) => {
    if (ctx.match === "") {
        throw new ParamNotExistError("kind");
    }
    ctx.session.tagKind = ctx.match;
    await ctx.conversation.enter(cvNames.rmTags);
});

controlComposer.on("callback_query:data", async ctx => {
    const callbackData = ctx.callbackQuery.data;
    switch (callbackData) {
        case "general":
        case "sensitive":
        case "questionable":
        case "explicit":
            ctx.session.rating = callbackData;
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



export default controlComposer;