import { Composer, InlineKeyboard } from "grammy";
import { fmt, bold, italic, code } from "@grammyjs/parse-mode";
import { ReservedApi } from "../../ReservedWord.js";
import { ClientStateEnum } from "../../type/CustomEnum.js";
import { ReserveWord } from "../../ReservedWord.js";
import { ParamNotExistHandle } from "../Helper/ToolFunc.js";
import { RatingEnum } from "../../type/CustomEnum.js";
import { getRatingText } from "../../ToolFunc.js";
import { levelLog, LogLevel } from "../../utils/LevelLog.js";
import SqlSelectApi from "../../SqlApi/SelectApi.js";
import SqlInertApi from "../../SqlApi/InsertApi.js";
import SqlUpdateApi from "../../SqlApi/UpdateApi.js";
import SqlDeleteApi from "../../SqlApi/DeleteApi.js";

const controlComposer = new Composer<CusContext>();

controlComposer.command("set_rating", async ctx => {
    const inlineKeyboard = new InlineKeyboard()
        .text("general")
        .text("sensitive")
        .text("questionable")
        .row()
        .text("explicit")
        .text("disable");
    let ratingText = getRatingText((await SqlSelectApi.SelectUser(ctx.chatId)).rating);
    if (ratingText == undefined) {
        await ctx.replyFmt(
            fmt`you haven't set rating, you can set it by click the button below.`,
            {
                reply_markup: inlineKeyboard,
            },
        );
        return;
    }

    await ctx.replyFmt(
        fmt`${bold("Now rating")}: ${italic(ratingText)}\nyou can change rating by click the button below.`,
        {
            reply_markup: inlineKeyboard,
        },
    );
});

controlComposer.command("list_kinds", async ctx => {
    const allKinds = await SqlSelectApi.SelectAllKinds(ctx.chat.id);
    if (allKinds.length == 0) {
        ctx.reply(
            "there is still no kind, you can use /add_kind to add a kind",
        );
        return;
    }
    await ctx.replyFmt(fmt`${allKinds.map(kind => code(kind)).join(" ")}`);
});

controlComposer.command("list_tags", async ctx => {
    const kind = ctx.match;
    if (kind === "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    }
    const tags = await SqlSelectApi.SelectKindAllTags(ctx.chat.id, kind);
    if (tags.length == 0) {
        await ctx.replyFmt(
            fmt`there is still no tags in ${bold(kind)}, you can use /add_tags to add tags`,
        );
        return;
    }
    await ctx.replyFmt(
        fmt`${bold("[Kind]")}:  ${code(kind)}\n${bold("[tags]")}:  ${tags.map(tag => code(tag)).join(" ")}\n${bold("[count]")}:  ${tags.length}`
    );
});

controlComposer.command("add_kind", async ctx => {
    const kind = ctx.match;
    if (kind === "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    }
    if (ReservedApi.isReservedWord(kind)) {
        ctx.replyFmt(
            fmt`Can't use word ${code(kind)}, because it's a reserve word, please change`,
        );
        return;
    }
    await SqlInertApi.InsertKind(ctx.chat.id, kind);
    await ctx.replyFmt(`Add kind: ${code(kind)}`);
});

controlComposer.command("rename_kind", async ctx => {
    if (ctx.match === "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    }
    const kindId = await SqlSelectApi.SelectKindId(ctx.chat!.id, ctx.match);

    // await SqlUpdateApi.UpdateUserStateAKId(ctx.chatId, ClientStateEnum.rename_kind, kindId);
    await SqlUpdateApi.UpdateUser(ctx.chatId, { state: ClientStateEnum.rename_kind, action_kind_id: kindId });
    await ctx.reply("input a new kind name, it will replcae the old name.");
});

controlComposer.command("rm_kind", async ctx => {
    if (ctx.match === "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    }
    await SqlDeleteApi.DeleteKind(ctx.chat.id, ctx.match);
    await ctx.replyFmt(fmt`Remove kind: ${code(ctx.match)}`);
});

controlComposer.command("patch_tags", async ctx => {
    if (ctx.match === "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    }
    const kindId = await SqlSelectApi.SelectKindId(ctx.chat!.id, ctx.match);   // 确认kind存在
    // await SqlUpdateApi.UpdateUserStateAKId(ctx.chatId, ClientStateEnum.patch_tags, kindId);
    await SqlUpdateApi.UpdateUser(ctx.chatId, { state: ClientStateEnum.patch_tags, action_kind_id: kindId });
    await ctx.replyFmt(
        fmt`Please input new tags split by space. The new tag list will replace the old tag list.\nyou can just enter ${code(ReserveWord.exit)} to cancel.`,
    );
});


controlComposer.command("add_tags", async ctx => {
    if (ctx.match === "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    }
    const kindId = await SqlSelectApi.SelectKindId(ctx.chat!.id, ctx.match);   // 确认kind存在
    // await SqlUpdateApi.UpdateUserStateAKId(ctx.chatId, ClientStateEnum.add_tags, kindId);
    await SqlUpdateApi.UpdateUser(ctx.chatId, { state: ClientStateEnum.add_tags, action_kind_id: kindId });
    await ctx.replyFmt(
        fmt`Input the tag you want to add, divided by space\nOr you can just enter ${code(ReserveWord.exit)} to cancel.`,
    );
})

controlComposer.command("rm_tags", async ctx => {
    if (ctx.match === "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    }
    const kindId = await SqlSelectApi.SelectKindId(ctx.chat!.id, ctx.match);   // 确认kind存在
    // await SqlUpdateApi.UpdateUserStateAKId(ctx.chatId, ClientStateEnum.remove_tags, kindId);
    await SqlUpdateApi.UpdateUser(ctx.chatId, { state: ClientStateEnum.remove_tags, action_kind_id: kindId });
    await ctx.replyFmt(
        fmt`Please input the tag you want to remove, divided by space.\nyou can just enter ${code(ReserveWord.clear)} to remove all tags or ${code(ReserveWord.exit)} to cancel.`
    );
});


// 用于取代对话的处理
controlComposer.on("message:text", async ctx => {
    const user = await SqlSelectApi.SelectUser(ctx.chatId);
    if (user.state == ClientStateEnum.default) {
        return;
    }
    const text = ctx.message.text as string;
    const kindId = user.actionKindId;
    if (text == ReserveWord.exit) {
        ctx.reply("action exit.");
        return;
    }
    switch (user.state) {
        case ClientStateEnum.add_tags:
            // 添加
            const tagsToAdd = new Set<string>(text.split(" "));
            const insertCount = await SqlInertApi.InsertTags(kindId, tagsToAdd);
            await ctx.replyFmt(fmt`add tags, count: ${bold(insertCount)}`);
            break;
        case ClientStateEnum.remove_tags:
            // 删除
            if (text == ReserveWord.clear) {
                await SqlDeleteApi.DeleteAllKindTag(kindId);
                await ctx.reply("All tags have been remove.");
            } else {
                const inputTags = new Set<string>(text.split(" "));
                // 删除
                const deleteCount = await SqlDeleteApi.DeleteKindTag(kindId, inputTags);
                await ctx.replyFmt(fmt`remove tags, count: ${bold(deleteCount)}}`);
            }
            break;
        case ClientStateEnum.patch_tags:
            // // 覆盖
            const newTags = new Set<string>(text.split(" "));
            await SqlDeleteApi.DeleteAllKindTag(kindId);
            await SqlInertApi.InsertTags(kindId, newTags);
            await ctx.replyFmt(fmt`patch tags, new tags count: ${bold(newTags.size)} `);
            break;
        case ClientStateEnum.rename_kind:
            // await SqlUpdateApi.UpdateKindName(user.actionKindId, text);
            await SqlUpdateApi.UpdateKind(user.actionKindId, { kind: text });
            await ctx.replyFmt(fmt`rename to ${bold(text)} success.`);
            break;
        default:
            // 理论上不会到这里
            levelLog(LogLevel.error, `Unhandle ClientState`);
            throw new Error("Unhandle ClientState");
    }

    // await SqlUpdateApi.UpdateUserStateAKId(ctx.chatId, ClientStateEnum.default, -1);
    await SqlUpdateApi.UpdateUser(ctx.chatId, { state: ClientStateEnum.default, action_kind_id: -1 })
});

controlComposer.on("callback_query:data", async ctx => {
    const callbackData = ctx.callbackQuery.data;
    let newRating;
    let msg;
    switch (callbackData) {
        case "general":
            newRating = RatingEnum.general;
            break;
        case "sensitive":
            newRating = RatingEnum.sensitive;
            break;
        case "questionable":
            newRating = RatingEnum.questionable;
            break;
        case "explicit":
            newRating = RatingEnum.explicit;
            break;
        default:
            newRating = RatingEnum.disable;
    }
    if (newRating == RatingEnum.disable) {
        msg = "The Rating has been disable";
    } else {
        msg = `The Rating has been set: ${callbackData}`;
    }
    // await SqlUpdateApi.UpdateUserRating(ctx.chatId!, newRating);
    await SqlUpdateApi.UpdateUser(ctx.chatId!, { rating: newRating })
    await ctx.answerCallbackQuery(msg);
});


export default controlComposer;