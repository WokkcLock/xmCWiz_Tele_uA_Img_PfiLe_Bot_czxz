import { Composer, InputFile } from "grammy";
import DanbooruApi from "../../DanbooruApi/index.js";
import { bold, fmt, italic, link } from "@grammyjs/parse-mode";
import SqlApi from "../../SqlApi/index.js";
import { ParamNotExistHandle } from "../Helper/ToolFunc.js";


const dan = await DanbooruApi.GetInstance();
const danComposer = new Composer<CusContext>();
const sql = SqlApi.GetInstance();

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
    const rating = (await sql.SelectUser(ctx.chat.id)).rating;
    const ret = await dan.GetImageFromTag(rating, tag);
    await ctx.replyFmtWithPhoto(new InputFile(new Uint8Array(ret.image_data)), {
        caption: fmt`\n${bold("tag")}: ${italic(tag)}\n${link("gallery", ret.dan_url)}`
    });
    // await canRetrySendPhotoWithTag(ctx, dan, tag);
});

danComposer.command("random", async ctx => {
    if (ctx.match == "") {
        await ParamNotExistHandle(ctx, "kind");
        return;
    } 
    const rating = (await sql.SelectUser(ctx.chat.id)).rating;
    const randomTag = await sql.SelectRandomKindTag(ctx.chat.id, ctx.match);
    const ret = await dan.GetImageFromTag(rating, randomTag);
    await ctx.replyFmtWithPhoto(new InputFile(new Uint8Array(ret.image_data)), {
        caption: fmt`\n${bold("tag")}: ${italic(randomTag)}\n${link("gallery", ret.dan_url)}`
    });
});


export default danComposer;