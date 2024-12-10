import { Composer, GrammyError, InputFile } from "grammy";
import DanbooruApi from "../../DanbooruApi/index.js";
import { bold, fmt, italic, link } from "@grammyjs/parse-mode";
import { levelLog, LogLevel } from "../../utils/LevelLog.js";
import SqlApi from "../../SqlApi/index.js";


const dan = await DanbooruApi.GetInstance();
const danComposer = new Composer<CusContext>();
const sql = SqlApi.GetInstance();

const retryUpLimit = 3;
async function canRetrySendPhotoWithTag(ctx: CusContext, dan: DanbooruApi, tag: string) {
    let failCount = 0;
    while (1) {
        // 最多进行4次尝试
        try {
            const ret = await dan.GetImageFromTag(ctx.session.rating, tag);
            await ctx.replyFmtWithPhoto(new InputFile(new Uint8Array(ret.image_data)), {
                caption: fmt`\n${bold("tag")}: ${italic(tag)}\n${link("gallery", ret.dan_url)}`
            });
            break;
        } catch (error) {
            if (error instanceof GrammyError) {
                // sendPhoto错误, 进行重试
                if (failCount < retryUpLimit) {
                    levelLog(LogLevel.warn, "send photo fail, retry");
                    failCount++;
                } else {
                    // 发生了过多次的错误，将错误throw出去
                    levelLog(LogLevel.error, "too many sendPhoto error.");
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }
}




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
    const ret = await dan.GetImageFromTag(ctx.session.rating, tag);
    await ctx.replyFmtWithPhoto(new InputFile(new Uint8Array(ret.image_data)), {
        caption: fmt`\n${bold("tag")}: ${italic(tag)}\n${link("gallery", ret.dan_url)}`
    });
    // await canRetrySendPhotoWithTag(ctx, dan, tag);
});

danComposer.command("random", async ctx => {
    let kindId: number;
    let tagsCount: number;
    if (ctx.match == "") {
        // 在所有kind中随机
        ({ id: kindId, count: tagsCount } = await sql.SelectNotEmptyKindIdRandomSingle(ctx.chat.id));
    } else {
        // 直接选择输入的kind
        ({ id: kindId, count: tagsCount } = await sql.SelectKindIdCount(ctx.chat.id, ctx.match));
        if (tagsCount == 0) {
            await ctx.replyFmt(
                fmt`there is still no tags in ${bold(ctx.match)}, you can use /add_tags to add tags`,
            );
            return;
        }
    }
    // 一个合法的kindId和tagsCount
    const randomTag = await sql.SelectSingleRandomKindTag(kindId);
    // await canRetrySendPhotoWithTag(ctx, dan, randomTag);
    const ret = await dan.GetImageFromTag(ctx.session.rating, randomTag);
    await ctx.replyFmtWithPhoto(new InputFile(new Uint8Array(ret.image_data)), {
        caption: fmt`\n${bold("tag")}: ${italic(randomTag)}\n${link("gallery", ret.dan_url)}`
    });
});


export default danComposer;