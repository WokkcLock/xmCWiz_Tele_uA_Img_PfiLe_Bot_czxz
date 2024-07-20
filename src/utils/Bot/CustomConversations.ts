import { ReserveWord } from "./ReservedWord.js";
import { fmt, bold, code } from "@grammyjs/parse-mode";
import sql from "../Sql/index.js";

const cvNames = {
    addTags: "addTags",
    rmTags: "rmTags",
    patchKind: "patchKind",
};

class CustomConversations {

    async RmTags(conversation: CusConversation, ctx: CusContext) {
        const kind = ctx.session.tagKind
        const { id: kindId } = await conversation.external(() => sql.SelectKindIdCount(ctx.chat!.id, kind));
        await ctx.replyFmt(
            fmt`Please input the tag you want to remove, divided by space.\nyou can just enter ${code(ReserveWord.clear)} to remove all tags or ${code(ReserveWord.exit)} to cancel.`
        );
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            await ctx.reply("Exit add tags action.");
            return;
        } else if (inputText == ReserveWord.clear) {
            sql.DeleteAllKindTags(kindId);
            await ctx.replyFmt(fmt`clear all tags of ${code(kind)}`);
            return;
        }
        const inputTags = new Set<string>(inputText.split(" "));
        // 删除
        const deleteCount = await conversation.external(() => sql.DeleteKindTags(kindId, inputTags));
        await ctx.replyFmt(fmt`remove ${bold(deleteCount)} tags from ${code(kind)}`);
    }

    async AddTags(conversation: CusConversation, ctx: CusContext) {
        const kind = ctx.session.tagKind;
        try {
            const { id: kindId } = await conversation.external(() => sql.SelectKindIdCount(ctx.chat!.id, kind));
            // const kindId = 1;
            await ctx.replyFmt(
                fmt`Input the tag you want to add, divided by space\nOr you can just enter ${code(ReserveWord.exit)} to cancel.`,
            );
            const inputText = await conversation.form.text();
            if (inputText == ReserveWord.exit) {
                ctx.reply("Exit add tags action.");
                return;
            }
            const newTags = new Set<string>(inputText.split(" "));
            // 插入
            const insertCount = await conversation.external(() => sql.InsertTags(kindId, newTags));   
            await ctx.replyFmt(fmt`add ${bold(insertCount)} tags to ${code(kind)}`);
        } catch (err) {
            console.error(err);
        }
    }


    async PatchKind(conversation: CusConversation, ctx: CusContext) {
        const kind = ctx.session.tagKind;
        const { id: kindId } = await conversation.external(() => sql.SelectKindIdCount(ctx.chat!.id, kind));
        await ctx.replyFmt(
            fmt`Please input new tags split by space. The new tag list will replace the old tag list of kind: ${code(kind)}.\nyou can just enter ${code(ReserveWord.exit)} to cancel.`,
        );
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            ctx.reply("Exit add tags action.");
            return;
        }
        const newTags = new Set<string>(inputText.split(" "));
        // 删除
        await conversation.external(() => sql.DeleteAllKindTags(kindId));
        // 插入
        await conversation.external(() => sql.InsertTags(kindId, newTags));
        await ctx.replyFmt(fmt`patch ${bold(newTags.size)} tags to ${code(kind)}`);
    }
}

export { CustomConversations, cvNames };
