import { CommandContext, InputFile, InlineKeyboard, Bot } from "grammy";
import UserCacheManager from "../User/UserCacheManager.js";
import DanbooruApi from "../DanbooruApi.js";
import { LogLevel, levelLog } from "../LevelLog.js";
import { formatMdStr } from "../ToolFunc.js";
import MDecorator from "./MDecorator.js";
import { AllHasNoTagError, ParamKindNotExistError, TagFetchError } from "../CustomError.js";
import { cvNames } from "./CusCv.js";
import { ReservedApi } from "./ReservedWord.js";
import { bold, fmt, italic } from "@grammyjs/parse-mode";


class CommandMw {
    private _ucMan: UserCacheManager;
    private _dan: DanbooruApi;
    constructor(
        inputCacheManager: UserCacheManager,
        inputDanbooruApi: DanbooruApi,
    ) {
        this._ucMan = inputCacheManager;
        this._dan = inputDanbooruApi;
    }

    // command处理
    SetRating(ctx: CommandContext<CusContext>) {
        const inlineKeyboard = new InlineKeyboard()
            .text("general")
            .text("sensitive")
            .text("questionable")
            .row()
            .text("explicit")
            .text("disable")
        ctx.reply(
            `*Now rating*: _${this._dan.GetRating()}_\n*optional*: general, sensitive, questionable, explicit`,
            {
                reply_markup: inlineKeyboard,
                parse_mode: "MarkdownV2",
            },
        );
    }

    async Id(ctx: CommandContext<CusContext>) {
        const id = ctx.match;
        const reg = /\d+/g;
        if (!reg.test(id)) {
            ctx.reply("Your input id invalid, only number");
            return;
        }
        try {
            const ret = await this._dan.GetImageFromId(parseInt(id));
            await ctx.replyWithPhoto(new InputFile(ret.data), {
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
            ctx.reply("Your input tags invalid, please check danbooru", {
                parse_mode: "MarkdownV2",
            });
            return;
        }
        try {
            const ret = await this._dan.GetImageFromTags(tag);
            await ctx.replyWithPhoto(new InputFile(ret.data), {
                caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMdStr(tag)}_\n${formatMdStr(ret.source_url)}`,
                parse_mode: "MarkdownV2",
            });
        } catch (err) {
            levelLog(LogLevel.error, err);
            ctx.reply(`tag: ${tag}, fetch fail`);
        }
    }

    async ListKinds(ctx: CommandContext<CusContext>) {
        const kinds = await this._ucMan.GetAllKinds(ctx.chat.id);
        if (kinds.length == 0) {
            ctx.reply(
                "there is still no kind, you can use /add_kind to add a kind",
            );
        } else {
            ctx.reply(`\`${formatMdStr(kinds.join("`  `"))}\``, {
                parse_mode: "MarkdownV2",
            });
        }
    }

    @MDecorator.CusErrHanlde
    async ListKindTags(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            throw new ParamKindNotExistError();
        }
        const tags = await this._ucMan.GetKindTags(ctx.chat.id, kind);
        if (tags.length == 0) {
            ctx.replyFmt(
                fmt`there is still no tags in ${bold(kind)}, you can use /add_tags to add tags`,
            );
        } else {
            ctx.reply(
                `*\\[Kind\\]*:  \`${formatMdStr(kind)}\`\n*\\[tags\\]*:  \`${formatMdStr(tags.join("`  `"))}\``,
                {
                    parse_mode: "MarkdownV2",
                },
            );
        }
    }

    @MDecorator.CusErrHanlde
    async AddKind(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            throw new ParamKindNotExistError();
        }
        if (ReservedApi.isReservedWord(kind)) {
            ctx.reply(
                `Can't use word *${formatMdStr(kind)}*, because it's a reserve word, please change`,
                {
                    parse_mode: "MarkdownV2",
                },
            );
            return;
        }
        await this._ucMan.AddKind(ctx.chat.id, kind);
        ctx.reply(`*Add kind*: \`${formatMdStr(kind)}\``, {
            parse_mode: "MarkdownV2",
        });
    }

    @MDecorator.CusErrHanlde
    async RemoveKind(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        await this._ucMan.RemoveKind(ctx.chat.id, ctx.match);
        ctx.reply(`*Remove kind*: \`${ctx.match}\``, {
            parse_mode: "MarkdownV2",
        });
    }

    @MDecorator.CusErrHanlde
    async PatchKind(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        ctx.session.tagKind = ctx.match;
        await ctx.conversation.enter(cvNames.patchKind);
    }

    @MDecorator.CusErrHanlde
    async AddTags(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        ctx.session.tagKind = ctx.match;
        await ctx.conversation.enter(cvNames.addTags);
    }

    @MDecorator.CusErrHanlde
    async RemoveTags(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        ctx.session.tagKind = ctx.match;
        await ctx.conversation.enter(cvNames.rmTags);
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
                    caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMdStr(tags)}_\n${formatMdStr(ret.source_url)}`,
                    parse_mode: "MarkdownV2",
                });
                return;
            } else {
                kind = ctx.match;
                tags = await this._ucMan.GetKindRandomTag(ctx.chat.id, kind);
            }

            const ret = await this._dan.GetImageFromTags(tags);
            await ctx.replyWithPhoto(new InputFile(ret.data), {
                caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMdStr(tags)}_\n${formatMdStr(ret.source_url)}`,
                parse_mode: "MarkdownV2",
            });
        } catch (err: any) {
            if (err instanceof TagFetchError) {
                // tags达到请求失败上限，删除
                await this._ucMan.RmTags(ctx.chat.id, kind!, [tags!]);
                ctx.reply(
                    `Kind: *${formatMdStr(kind!)}*, Tag: _${formatMdStr(tags!)}_, 
                    meet the fetch fail limit, Remove tag. Restart the random command, please wait.`,
                    {
                        parse_mode: "MarkdownV2",
                    },
                );
                await this.Random(ctx);
            } else if (err instanceof AllHasNoTagError) {
                ctx.reply(`All kind has no tags, please add tag first.`);
                return;
            } else {
                throw err;
            }
        }
    }

    Start(ctx: CommandContext<CusContext>) {
        ctx.replyFmt(fmt`${bold("Welcome, you can use the commands below")}
         /start: ${italic("print the help message")}
         /tag <tag>: ${italic("get random image of the input tag")}
         /id <id>: ${italic("get certain image of the id")}
         /list_kinds: ${italic("list all kinds you set")}
         /list_tags <kind>: ${italic("list tags of a certain kind")} 
         /add_kind <kind>: ${italic("add a new tag kind")}
         /rm_kind <kind>: ${italic("remove a tag kind")}
         /patch_kind <kind>: ${italic("use new tag list cover a kind")}
         /add_tags <kind>: ${italic("add new tags to a exist kind")}
         /rm_tags <kind>: ${italic("remove tags of a exist kind")}
         /random [kind]: ${italic("Fetch images of the input kind random tag, will of all kinds Without parameters")}
         `)
        // ctx.reply(`your id: ${ctx.chat.id}`);
    }
}

class CallbackMw {
    private static _dan: DanbooruApi | undefined;

    static setDanbooruApi(inputDan: DanbooruApi) {
        this._dan = inputDan;
    }

    static setBotCallbackDataDataHandle(bot: Bot<CusContext>) {
        if (CallbackMw._dan == undefined) {
            throw Error("CallbackMw can't use before setDanbooruApi");
        }
        bot.on("callback_query:data", async ctx => {
            const callbackData = ctx.callbackQuery.data;
            switch (callbackData) {
                case "general":
                case "sensitive":
                case "questionable":
                case "explicit":
                    CallbackMw._dan!.SetRating(callbackData[0] as Rating);
                    await ctx.answerCallbackQuery(
                        `The Rating has been set: ${callbackData}`,
                    );
                    // 处理 Option 4 的逻辑
                    break;
                case "disable":
                    CallbackMw._dan!.DisableRating();
                    await ctx.answerCallbackQuery("The Rating has been disable");
                    break;
                default:
                    levelLog(LogLevel.error, `unknown callback_data: ${callbackData}`);
                    await ctx.answerCallbackQuery(); // 移除加载动画
                    return;
            }
        });
    }

}

export { CommandMw, CallbackMw };
