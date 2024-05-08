// CusCv: Custom Conversation

import { formatMarkDownStr } from "../utils/ToolFunc.js";
import UserCacheManager from "../utils/User/UserCacheManager.js";
import { ReserveWord } from "./ReservedWord.js";

const cvNames = {
    addTags: "addTags",
    rmTags: "rmTags",
    patchKind: "patchKind",
}

class CusCvClass 
{
    private _ucMan: UserCacheManager;
    constructor(inputCMan: UserCacheManager) {
        this._ucMan = inputCMan;
    }

    async AddTags(conversation: CusConversation, ctx: CusContext) {
        const nowTags = await this._ucMan.GetKindTags(ctx.chat!.id, ctx.session.tagKind);
        await ctx.reply(`[Kind]: ${ctx.session.tagKind}\nhas tags: ${ nowTags.join(",")}\n
            Please input the tag you want to add, divided by space\n Or you can just enter ${ReserveWord.exit} to exit.`);
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            ctx.reply("Exit add tags action.");
            return;
        }
        const tagsList = inputText.split(" ");
        const actionRet = await this._ucMan.AddTags(ctx.chat!.id, ctx.session.tagKind ,tagsList);
        ctx.reply(`Add ${actionRet.length} tags: ${actionRet} to kind: ${ctx.session.tagKind} successfully.\nnew tag count: ${actionRet.length}`);
    }

    async RmTags(conversation: CusConversation, ctx: CusContext) {
        const nowTags = await this._ucMan.GetKindTags(ctx.chat!.id, ctx.session.tagKind);
        await ctx.reply(`[Kind]: ${ctx.session.tagKind}\nhas tags: ${nowTags.join(",")}\n
            Please input the tag you want to remove, divided by space\n Or you can just enter ${ReserveWord.exit} to exit.`);
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            ctx.reply("Exit add tags action.");
            return;
        }
        const tagList = inputText.split(" ");
        const actionRet = await this._ucMan.RmTags(ctx.chat!.id, ctx.session.tagKind, tagList);
        ctx.reply(`Remove ${actionRet.length} tags: ${actionRet} from kind: ${ctx.session.tagKind} successfully.`); 
    }
    
    async PatchKind(conversation: CusConversation, ctx: CusContext) {
        await ctx.reply(
            `Please input new tags split by space. The new tag list will replace the old tag list of kind: ${ctx.session.tagKind}. 
            \nOr you can just enter ${ReserveWord.exit} to exit.`);
        const inputText = await conversation.form.text();
        if (inputText == ReserveWord.exit) {
            ctx.reply("Exit add tags action.");
            return;
        }
        const tagsList = inputText.split(" ");
        this._ucMan.PatchKind(ctx.chat!.id, ctx.session.tagKind, tagsList);
        ctx.reply(`Kind: ${ctx.session.tagKind}, patch success`); 
    }

}



export { CusCvClass, cvNames };