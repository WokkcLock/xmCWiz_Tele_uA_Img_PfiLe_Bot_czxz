import { fmt, bold } from "@grammyjs/parse-mode";

export function ParamNotExistHandle(ctx: CusContext, msg: string) {
    return ctx.replyFmt(fmt`the command need the param:  <${bold(msg)}>`);
}