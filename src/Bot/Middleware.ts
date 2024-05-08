import { CommandContext, Context, InputFile } from "grammy";
import UserCacheManager from "../utils/User/UserCacheManager.js";
import DanbooruApi from "../utils/DanbooruApi.js";
import { LogLevel, levelLog } from "../utils/LevelLog.js";
import { formatMarkDownStr } from "../utils/ToolFunc.js";
import MDecorator from "./MDecorator.js";
import { AllHasNoTagError, TagFetchError } from "../utils/User/CustomError.js";
import { cvNames } from "./CusCv.js";
import { ReservedApi } from "./ReservedWord.js";

class CommandMw {
    private _ucMan: UserCacheManager;
    private _dan: DanbooruApi;
    constructor(inputCacheManager: UserCacheManager, inputDanbooruApi: DanbooruApi) {
        this._ucMan = inputCacheManager;
        this._dan = inputDanbooruApi;

    }

    // command处理
    SetRating(ctx: CommandContext<CusContext>) {
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

    async Id(ctx: CommandContext<CusContext>) {
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

    async Tag(ctx: CommandContext<CusContext>) {
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

    async ListKinds(ctx: CommandContext<CusContext>) {
        const kinds = await this._ucMan.GetAllKinds(ctx.chat.id);
        ctx.reply(`*All kinds*: _${formatMarkDownStr([...kinds].join(", "))}_`, {
            parse_mode: "MarkdownV2",
        });
    }

    async ListKindTags(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            ctx.reply("*Please input the param: kind name*", {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        const tags = await this._ucMan.GetKindTags(ctx.chat.id, kind);
        ctx.reply(`*Kind*: _${kind}_\n*Tags*: _${formatMarkDownStr([...tags].join(", "))}_`, {
            parse_mode: "MarkdownV2",
        });
    }

    @MDecorator.CusErrHanlde
    async AddKind(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            ctx.reply("*Please input kind*", {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        if (ReservedApi.isReservedWord(kind)) {
            ctx.reply(`*Can't use word ${kind}, because it's a reserve word, please change*`, {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        await this._ucMan.AddKind(ctx.chat.id, kind);
        ctx.reply(`*Add kind*: _${kind}_`, {
            parse_mode: "MarkdownV2",
        });
    }

    @MDecorator.CusErrHanlde
    async RemoveKind(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            ctx.reply("*Please input kind*", {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        await this._ucMan.RemoveKind(ctx.chat.id, kind);
        ctx.reply(`*Remove kind*: _${kind}_`, {
            parse_mode: "MarkdownV2",
        });
    }

    @MDecorator.CusErrHanlde
    async PatchKind(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            ctx.reply("*Please input kind*", {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        ctx.session.tagKind = kind;
        await ctx.conversation.enter(cvNames.patchKind);
    }


    @MDecorator.CusErrHanlde
    async AddTags(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            ctx.reply("*Please input the param kind *", {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        ctx.session.tagKind = kind;
        await ctx.conversation.enter(cvNames.addTags);
        // await this._ucMan.AddTag(ctx.chat.id, kind, tag);
        // ctx.reply(`*Add tag*: _${tag}_ to *${kind}*`, {
        //     parse_mode: "MarkdownV2",
        // });
    }

    @MDecorator.CusErrHanlde
    async RemoveTags(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            ctx.reply("*Please input the param: kind*", {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        ctx.session.tagKind = kind;
        await ctx.conversation.enter(cvNames.rmTags);
        // await this._ucMan.RemoveTag(ctx.chat.id, kind, tag);
        // ctx.reply(`*Remove tag*: _${tag}_ from *${kind}*`, {
        //     parse_mode: "MarkdownV2",
        // });
    }

    @MDecorator.CusErrHanlde
    async Random(ctx: CommandContext<CusContext>) {
        let tags: string;
        let kind: string;

        try {
            if (ctx.match === "") {
                [kind, tags] = await this._ucMan.GetAllRandomTag(ctx.chat.id);
                const ret = await this._dan.GetImageFromTags(tags);
                await ctx.replyWithPhoto(new InputFile(ret.data), {
                    caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMarkDownStr(tags)}_\n${formatMarkDownStr(ret.source_url)}`,
                    parse_mode: "MarkdownV2",
                });
                return;
            } else {
                kind = ctx.match;
                tags = await this._ucMan.GetKindRandomTag(ctx.chat.id, kind);
            }

            const ret = await this._dan.GetImageFromTags(tags);
            await ctx.replyWithPhoto(new InputFile(ret.data), {
                caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMarkDownStr(tags)}_\n${formatMarkDownStr(ret.source_url)}`,
                parse_mode: "MarkdownV2",
            });
        } catch (err: any) {
            if (err instanceof TagFetchError) {
                // tags达到请求失败上限，删除
                await this._ucMan.RmTags(ctx.chat.id, kind!, [tags!]);
                ctx.reply(`Kind: *${formatMarkDownStr(kind!)}*, Tag: _${formatMarkDownStr(tags!)}_, 
                    meet the fetch fail limit, Remove tag. Restart the random command, please wait.`, {
                    parse_mode: "MarkdownV2",
                });
                await this.Random(ctx);
            } else if (err instanceof AllHasNoTagError) {
                ctx.reply(`All kind has no tags, please add tag first.`);
                return;
            }
            else {
                throw err;
            }
        }
    }

    Start(ctx: CommandContext<CusContext>) {
        ctx.reply(`*Welcome to img bot*\n*Usage*: \n/tag <tag>\n/id <id>\n/rating`, {
            parse_mode: "MarkdownV2",
        });
    }
}

export default CommandMw;