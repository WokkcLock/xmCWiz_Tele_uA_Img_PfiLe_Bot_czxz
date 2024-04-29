import { CommandContext, Context, InputFile } from "grammy";
import UserCacheManager from "../utils/UserCacheManager.js";
import DanbooruApi from "../utils/DanbooruApi.js";
import { LogLevel, levelLog } from "../utils/LevelLog.js";
import { formatMarkDownStr } from "../utils/ToolFunc.js";
import MDecorator from "./MDecorator.js";

class Middleware {
    private _cMan: UserCacheManager;
    private _dan: DanbooruApi;
    private constructor(inputCacheManager: UserCacheManager, inputDanbooruApi: DanbooruApi) {
        this._cMan = inputCacheManager;
        this._dan = inputDanbooruApi;

    }

    static async Create() {
        return new Middleware(
            new UserCacheManager(),
            await DanbooruApi.Create());
    }
 
    // command处理
    SetRating(ctx: CommandContext<Context>) {
        ctx.reply(
            `*Now rating*: _${this._dan.GetRating()}_\n*optional*: general, sensitive, questionable, explicit`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "general", callback_data: "general" },
                            { text: "sensitive", callback_data: "sensitive" },
                            { text: "questionable", callback_data: "questionable" },
                            { text: "explicit", callback_data: "explicit" },
                            { text: "disable", callback_data: "disable" },
                        ],
                    ],
                    resize_keyboard: true,
                },
                parse_mode: "MarkdownV2",
            },
        );
    }

    async GetImageFromId(ctx: CommandContext<Context>) {
        const id = ctx.match;
        const reg = /\d+/g;
        if (!reg.test(id)) {
            ctx.reply("*Your input id invalid, only number*", {
                parse_mode: "MarkdownV2",
            });
            return;
        }

        try {
            const ret = await this._dan.GetImageFromId(parseInt(id));
            await ctx.replyWithPhoto(
                new InputFile(ret.data),
                {
                    caption: ret.source_url,
                });
        } catch (err) {
            levelLog(LogLevel.error, err);
            ctx.reply(`image id: ${id}, fetch fail`);
        }
    }

    async GetImageFromTag(ctx: CommandContext<Context>) {
        const tag = ctx.match;
        const reg = /^\S+$/g;
        if (!reg.test(tag)) {
            ctx.reply("*Your input tags invalid, please check danbooru*", {
                parse_mode: "MarkdownV2",
            });
            return;
        }

        try {
            const ret = await this._dan.GetImageFromTags(tag);
            await ctx.replyWithPhoto(new InputFile(ret.data), {
                caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMarkDownStr(tag)}_\n${formatMarkDownStr(ret.source_url)}`,
                parse_mode: "MarkdownV2",
            });
        } catch (err) {
            levelLog(LogLevel.error, err);
            ctx.reply(`tag: ${tag}, fetch fail`);
        }

    }

    
}