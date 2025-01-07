import { Composer, InputFile } from "grammy";
import DanbooruApi from "../../DanbooruApi/index.js";
import { bold, fmt, italic, link } from "@grammyjs/parse-mode";
import { ParamNotExistHandle } from "../Helper/ToolFunc.js";
import SqlSelectApi from "../../SqlApi/SelectApi.js";
import SqlWrapperApi from "../../SqlApi/WrapperApi.js";


const dan = await DanbooruApi.GetInstance();
const danComposer = new Composer<CusContext>();

danComposer.command("id", async (ctx) => {
    const id = ctx.match;
    const reg = /\d+/g;
    if (!reg.test(id)) {
        ctx.reply("Your input id invalid, only number");
        return;
    }
    const ret = await dan.GetImageFromId(parseInt(id));
    await ctx.replyFmtWithPhoto(
        new InputFile(new Uint8Array(ret.image_data)),
        {
            caption: fmt`${link("gallery", ret.dan_url)}`,
        });

});

danComposer.command("tag", async (ctx) => {
    const tag = ctx.match;
    const reg = /^\S+$/g;
    if (!reg.test(tag)) {
        ctx.reply("Your input tags invalid, please check danbooru");
        return;
    }
    const rating = (await SqlWrapperApi.GetSession(ctx.chatId)).rating;
    for (let i = 0; i < 2; i++) {
        try {
            const ret = await dan.GetImageFromTag(ctx.chatId, rating, tag);
            await ctx.replyFmtWithPhoto(new InputFile(new Uint8Array(ret.image_data)), {
                caption: fmt`\n${bold("tag")}: ${italic(tag)}\n${link("gallery", ret.dan_url)}`
            });
            return;
        } catch (error) {
            // ignore
            if (i == 2) {
                // 最多重试两次
                throw error;
            }
        }
    }
    // await canRetrySendPhotoWithTag(ctx, dan, tag);
});

danComposer.command("random", async ctx => {
    if (ctx.match == "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    } 
    const rating = (await SqlWrapperApi.GetSession(ctx.chatId)).rating;
    const randomTag = await SqlSelectApi.SelectRandomKindTag(ctx.chat.id, ctx.match);
    for (let i = 0; i < 2; i++) {
        try {
            const ret = await dan.GetImageFromTag(ctx.chatId, rating, randomTag);
            await ctx.replyFmtWithPhoto(new InputFile(new Uint8Array(ret.image_data)), {
                caption: fmt`\n${bold("tag")}: ${italic(randomTag)}\n${link("gallery", ret.dan_url)}`
            });
            return;
        } catch (error) {
            // ignore
            if (i == 2) {
                // 最多重试两次
                throw error;
            }
        }
    }
});


export default danComposer;