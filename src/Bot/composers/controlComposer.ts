import { Composer } from "grammy";
import { InlineKeyboard } from "grammy";
import { fmt, bold, italic, code } from "@grammyjs/parse-mode";
import { ReservedApi } from "../../utils/Helper/ReservedWord.js";
import SqlApi from "../../SqlApi/index.js";
import { levelLog, LogLevel } from "../../utils/LevelLog.js";
import { ClientStateEnum } from "../../type/CustomEnum.js";
import { ReserveWord } from "../../utils/Helper/ReservedWord.js";
import { ParamNotExistHandle } from "../Helper/ToolFunc.js";

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

controlComposer.command("list_kinds", async ctx => {
    const allKinds = await sql.SelectAllKinds(ctx.chat.id);
    if (allKinds.length == 0) {
        ctx.reply(
            "there is still no kind, you can use /add_kind to add a kind",
        );
        return;
    }
    ctx.replyFmt(fmt`${allKinds.map(kind => code(kind)).join(" ")}`);
});

controlComposer.command("list_tags", async ctx => {
    const kind = ctx.match;
    if (kind === "") {
        ParamNotExistHandle(ctx, "kind");
        return;
    }
    const tags = await sql.SelectKindTags(ctx.chat.id, kind);
    if (tags.length == 0) {
        ctx.replyFmt(
            fmt`there is still no tags in ${bold(kind)}, you can use /add_tags to add tags`,
        );
        return;
    }
    ctx.replyFmt(
        fmt`${bold("[Kind]")}:  ${code(kind)}\n${bold("[tags]")}:  ${tags.map(tag => code(tag)).join(" ")}\n${bold("[count]:")} ${tags.length}`
    );
});

controlComposer.command("add_kind", ctx => {
    const kind = ctx.match;
    if (kind === "") {
        ParamNotExistHandle(ctx, "kind");
        return;
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
        ParamNotExistHandle(ctx, "kind");
        return;
    }
    sql.DeleteKind(ctx.chat.id, ctx.match);
    ctx.replyFmt(fmt`Remove kind: ${code(ctx.match)}`);
});

controlComposer.command("patch_kind", async ctx => {
    if (ctx.match === "") {
        ParamNotExistHandle(ctx, "kind");
        return;
    }
    const { id: kindId } = await sql.SelectKindIdCount(ctx.chat!.id, ctx.match);   // 确认kind存在
    ctx.session.actionKindId = kindId;
    ctx.session.state = ClientStateEnum.patch;
    ctx.replyFmt(
        fmt`Please input new tags split by space. The new tag list will replace the old tag list.\nyou can just enter ${code(ReserveWord.exit)} to cancel.`,
    );
});


controlComposer.command("add_tags", async ctx => {
    if (ctx.match === "") {
        ParamNotExistHandle(ctx, "kind");
        return;
    }
    const { id: kindId } = await sql.SelectKindIdCount(ctx.chat!.id, ctx.match);   // 确认kind存在
    ctx.session.actionKindId = kindId;
    ctx.session.state = ClientStateEnum.add;
    await ctx.replyFmt(
        fmt`Input the tag you want to add, divided by space\nOr you can just enter ${code(ReserveWord.exit)} to cancel.`,
    );
})

controlComposer.command("rm_tags", async ctx => {
    if (ctx.match === "") {
        ParamNotExistHandle(ctx, "kind");
        return;
    }
    const { id: kindId } = await sql.SelectKindIdCount(ctx.chat!.id, ctx.match);   // 确认kind存在
    ctx.session.actionKindId = kindId;
    ctx.session.state = ClientStateEnum.remove;
    ctx.replyFmt(
        fmt`Please input the tag you want to remove, divided by space.\nyou can just enter ${code(ReserveWord.clear)} to remove all tags or ${code(ReserveWord.exit)} to cancel.`
    );
});


// 用于取代对话的处理
controlComposer.on("message:text", async ctx => {
    levelLog(LogLevel.debug, `recv text: ${ctx.message.text}`);
    if (ctx.session.state == ClientStateEnum.default) {
        return;
    }
    const text = ctx.message.text as string;
    const kindId = ctx.session.actionKindId;
    if (text == ReserveWord.exit) {
        ctx.reply("action exit.");
        return;
    }
    switch (ctx.session.state) {
        case ClientStateEnum.add:
            // 添加
            const tagsToAdd = new Set<string>(text.split(" "));
            const insertCount = await sql.InsertTags(kindId, tagsToAdd);
            ctx.replyFmt(fmt`add tags, count: ${bold(insertCount)}. }`);
            break;
        case ClientStateEnum.remove:
            // 删除
            if (text == ReserveWord.clear) {
                sql.DeleteAllKindTags(kindId);
                ctx.reply("All tags have been remove.");
            } else {
                const inputTags = new Set<string>(text.split(" "));
                // 删除
                const deleteCount = await sql.DeleteKindTags(kindId, inputTags);
                ctx.replyFmt(fmt`remove tags, count: ${bold(deleteCount)}}`);
            }
            break;
        case ClientStateEnum.patch:
            // // 覆盖
            const newTags = new Set<string>(text.split(" "));
            await sql.DeleteAllKindTags(kindId);
            await sql.InsertTags(kindId, newTags);
            ctx.replyFmt(fmt`patch tags, new tags count: ${bold(newTags.size)} `);
            break;
        default:
            // 理论上不会到这里
            throw new Error("Unknown ClientState");
    };
    ctx.session.state = ClientStateEnum.default;
})

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