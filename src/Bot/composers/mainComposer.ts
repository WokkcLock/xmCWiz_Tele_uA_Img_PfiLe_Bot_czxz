import { Composer } from "grammy";
import { fmt, bold, italic } from "@grammyjs/parse-mode";
import controlComposer from "./controlComposer.js";
import danComposer from "./danComposer.js";

const mainComposer = new Composer<CusContext>();

mainComposer.command("start", ctx => {
    ctx.replyFmt(
        fmt(
            ["", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n", "\n"],
            fmt`${bold("Welcome, you can use the commands below")}`,
            fmt`/start: ${italic("print the help message")}`,
            fmt`/set_rating: ${italic("set the rating of image.")}`,
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
});

mainComposer.use(controlComposer);

mainComposer.use(danComposer);

export default mainComposer;