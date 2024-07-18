import DanbooruApi from "../DanbooruApi.js";
import SqlApi from "../Sql/SqlApi.js";
import { levelLog, LogLevel } from "../LevelLog.js";
import { CommandContext, InlineKeyboard, InputFile } from "grammy";
import { bold, fmt, italic, code, link } from "@grammyjs/parse-mode";
import { ParamKindNotExistError } from "../CustomError.js";
import MDecorator from "./MDecorator.js";
import { ReservedApi } from "./ReservedWord.js";
import { cvNames } from "./CustomConversations.js";
import { assert } from "console";

class CommandMw {
    private _dan: DanbooruApi;
    private _sql: SqlApi;
    constructor(inputDan: DanbooruApi, inputSql: SqlApi) {
        this._dan = inputDan
        this._sql = inputSql;
    }

    SetRating(ctx: CommandContext<CusContext>) {
        const inlineKeyboard = new InlineKeyboard()
            .text("general")
            .text("sensitive")
            .text("questionable")
            .row()
            .text("explicit")
            .text("disable");
        let rating: string;
        switch (ctx.session.rating) {
            case "g":
                rating = "general";
                break;
            case "s":
                rating = "sensitive";
                break;
            case "q":
                rating = "questionable";
                break;
            case "e":
                rating = "explicit";
                break;
            default:
                rating = "disable";
        }
        ctx.replyFmt(
            fmt`${bold("Now rating")}: ${italic(rating)}\n${bold("optional")}: general, sensitive, questionable, explicit`,
            {
                reply_markup: inlineKeyboard,
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
            await ctx.replyWithPhoto(
                new InputFile(ret.data),
                {
                    caption: ret.source_url,
                });
        } catch (err) {
            levelLog(LogLevel.error, err);
            await ctx.replyFmt(fmt`${bold("[id]")} : ${code(id)}, fetch fail`);
        }
    }

    async Tag(ctx: CommandContext<CusContext>) {
        const tag = ctx.match;
        const reg = /^\S+$/g;
        if (!reg.test(tag)) {
            ctx.reply("Your input tags invalid, please check danbooru");
            return;
        }
        try {
            const ret = await this._dan.GetImageFromTag(ctx.session.rating, tag);
            await ctx.replyFmtWithPhoto(
                new InputFile(ret.image_data),
                {
                    caption: fmt`${bold("image id")}: ${italic(ret.image_id)}\n${bold("tags")}: ${italic(tag)}\n${ret.image_url}`
                }
            );
        } catch (err) {
            levelLog(LogLevel.error, err);
            await ctx.replyFmt(`${bold("[tag]")}: ${code(tag)}, fetch fail`);
        }
    }

    async ListKinds(ctx: CommandContext<CusContext>) {
        const allKinds = this._sql.SelectAllKinds(ctx.chat.id);
        if (allKinds.length == 0) {
            await ctx.reply(
                "there is still no kind, you can use /add_kind to add a kind",
            );
            return;
        }
        await ctx.replyFmt(fmt`${allKinds.map(kind => code(kind)).join(" ")}`);
    }

    @MDecorator.CusErrHanlde
    async ListKindTags(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            throw new ParamKindNotExistError();
        }
        const tags = await this._sql.SelectKindTags(ctx.chat.id, kind);
        if (tags.length == 0) {
            await ctx.replyFmt(
                fmt`there is still no tags in ${bold(kind)}, you can use /add_tags to add tags`,
            );
            return;
        }
        await ctx.replyFmt(
            fmt`${bold("[Kind]")}:  ${code(kind)}\n${bold("[tags]")}:  ${tags.map(tag => code(tag)).join(" ")}`
        );
    }

    @MDecorator.CusErrHanlde
    async AddKind(ctx: CommandContext<CusContext>) {
        const kind = ctx.match;
        if (kind === "") {
            throw new ParamKindNotExistError();
        }
        if (ReservedApi.isReservedWord(kind)) {
            await ctx.replyFmt(
                fmt`Can't use word ${code(kind)}, because it's a reserve word, please change`,
            );
            return;
        }
        this._sql.InsertKind(ctx.chat.id, kind);
        await ctx.replyFmt(`Add kind: ${code(kind)}`);
    }

    @MDecorator.CusErrHanlde
    async RemoveKind(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        this._sql.DeleteKind(ctx.chat.id, ctx.match);
        ctx.replyFmt(fmt`Remove kind: ${code(ctx.match)}`);
    }

    @MDecorator.CusErrHanlde
    async PatchKind(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        ctx.session.tagKind = ctx.match;
        ctx.session.sql = this._sql;
        await ctx.conversation.enter(cvNames.patchKind);
    }

    @MDecorator.CusErrHanlde
    async AddTags(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        ctx.session.tagKind = ctx.match;
        ctx.session.sql = this._sql;
        await ctx.conversation.enter(cvNames.addTags);
    }

    @MDecorator.CusErrHanlde
    async RemoveTags(ctx: CommandContext<CusContext>) {
        if (ctx.match === "") {
            throw new ParamKindNotExistError();
        }
        ctx.session.tagKind = ctx.match;
        ctx.session.sql = this._sql;
        await ctx.conversation.enter(cvNames.rmTags);
    }

    @MDecorator.CusErrHanlde
    async Random(ctx: CommandContext<CusContext>) {
        let kindId: number;
        let tagsCount: number;
        if (ctx.match == "") {
            // 在所有kind中随机
            ({ id: kindId, count: tagsCount } = this._sql.SelectNotEmptyKindIdRandomSingle(ctx.chat.id));
        } else {
            // 直接选择输入的kind
            ({ id: kindId, count: tagsCount } = this._sql.SelectKindIdCount(ctx.chat.id, ctx.match));
            if (tagsCount == 0) {
                await ctx.replyFmt(
                    fmt`there is still no tags in ${bold(ctx.match)}, you can use /add_tags to add tags`,
                );
                return;
            }
        }

        // 一个合法的kindId和tagsCount
        const randomTag = this._sql.SelectSingleRandomKindTag(kindId);
        const ret = await this._dan.GetImageFromTag(ctx.session.rating, randomTag);
        await ctx.replyFmtWithPhoto(new InputFile(ret.image_data), {
            caption: fmt`\n${bold("image id")}: ${italic(ret.image_id)}\n${bold("tag")}: ${italic(randomTag)}\n${link("url", ret.image_url)}`
        });
    }


    Start(ctx: CommandContext<CusContext>) {
        ctx.replyFmt(
            fmt(
                ["", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n", ""],
                fmt`${bold("Welcome, you can use the commands below")}`,
                fmt`/start: ${italic("print the help message")}`,
                fmt`/tag <tag>: ${italic("get random image of the input tag")}`,
                fmt`/id <id>: ${italic("get certain image of the id")}`,
                fmt`/list_kinds: ${italic("list all kinds you set")}`,
                fmt`/list_tags <kind>: ${italic("list tags of a certain kind")}`,
                fmt`/add_kind <kind>: ${italic("add a new tag kind")}`,
                fmt`/rm_kind <kind>: ${italic("remove a tag kind")}`,
                fmt`/patch_kind <kind>: ${italic("use new tag list cover a kind")}`,
                fmt`/add_tags <kind>: ${italic("add new tags to a exist kind")}`,
                fmt`/rm_tags <kind>: ${italic("remove tags of a exist kind")}`,
                fmt`/random [kind]: ${italic("Fetch images of the input kind random tag, will of all kinds Without parameters")}`
            )
        );
    }

}

export default CommandMw;