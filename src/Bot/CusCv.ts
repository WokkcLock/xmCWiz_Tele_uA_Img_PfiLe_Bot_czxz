// CusCv: Custom Conversation

import UserCacheManager from "../utils/User/UserCacheManager.js";

const cvNames = {
    addTag: "addTag",
}

class CusCvClass 
{
    private _ucMan: UserCacheManager;
    constructor(inputCMan: UserCacheManager) {
        this._ucMan = inputCMan;
    }

    async AddTags(conversation: CusConversation, ctx: CusContext) {
        const nowTags = this._ucMan.GetKindTags(ctx.chat!.id, ctx.session.tagKind);
        await ctx.reply(`[Kind]: ${ctx.session.tagKind}, has tags: ${nowTags}
            Please input the tag you want to add, divided by space`);
        const inputText = await conversation.form.text();
        const tagsList = inputText.split(" ");
        await this._ucMan.AddTags(ctx.chat!.id, ctx.session.tagKind ,tagsList);
        ctx.reply(`Add tags successfully.`);
    }
    
}



export { CusCvClass, cvNames };