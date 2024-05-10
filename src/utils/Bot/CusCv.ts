// CusCv: Custom Conversation

import UserCacheManager from "../User/UserCacheManager.js";
import { ReserveWord } from "./ReservedWord.js";
import { KindNotExistError } from "../CustomError.js";
import { fmt, bold, italic, code } from "@grammyjs/parse-mode";

const cvNames = {
    addTags: "addTags",
    rmTags: "rmTags",
    patchKind: "patchKind",
};

class CusCvClass {
    private _ucMan: UserCacheManager;
    constructor(inputCMan: UserCacheManager) {
        this._ucMan = inputCMan;
    }

    async AddTags(conversation: CusConversation, ctx: CusContext) {
        const kind = ctx.session.tagKind
        if (!(await this._ucMan.IsKindExist(ctx.chat!.id, kind))) {
            throw new KindNotExistError(kind);
        }
        await ctx.replyFmt(
            fmt`Input the tag you want to add, divided by space\nOr you can just enter ${code(ReserveWord.exit)} to exit.`,
        );
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            ctx.reply("Exit add tags action.");
            return;
        }
        const tagsList = inputText.split(" ");
        const actionRet = await this._ucMan.AddTags(
            ctx.chat!.id,
            kind,
            tagsList,
        );
        ctx.replyFmt(
            fmt`Add ${bold(actionRet)} to ${code(kind)}`,
        );
    }

    async RmTags(conversation: CusConversation, ctx: CusContext) {
        const kind = ctx.session.tagKind
        if (!(await this._ucMan.IsKindExist(ctx.chat!.id, kind))) {
            throw new KindNotExistError(kind);
        }
        await ctx.replyFmt(fmt`Please input the tag you want to remove, divided by space\n Or you can just enter ${code(ReserveWord.exit)} to exit.`);
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            ctx.reply("Exit add tags action.");
            return;
        }
        const tagList = inputText.split(" ");
        const actionRet = await this._ucMan.RmTags(
            ctx.chat!.id,
            kind,
            tagList,
        );
        ctx.replyFmt(
            fmt`Remove ${bold(actionRet)} tags from ${code(kind)}`,
        );
    }

    async PatchKind(conversation: CusConversation, ctx: CusContext) {
        const kind = ctx.session.tagKind
        if (!(await this._ucMan.IsKindExist(ctx.chat!.id, kind))) {
            throw new KindNotExistError(kind);
        }
        await ctx.replyFmt(
            fmt`Please input new tags split by space. The new tag list will replace the old tag list of kind: ${ctx.session.tagKind}. 
            \nOr you can just enter ${code(ReserveWord.exit)} to exit.`,
        );
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            ctx.reply("Exit add tags action.");
            return;
        }
        const tagsList = inputText.split(" ");
        const actionRet = this._ucMan.PatchKind(ctx.chat!.id, kind, tagsList);
        ctx.replyFmt(fmt`patch ${bold(actionRet)} tags to ${code(kind)}`);
    }
}

export { CusCvClass, cvNames };
