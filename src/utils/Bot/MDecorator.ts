import {
    KindNotExistError,
    KindAlreadyExistError,
    EmptyKindError,
    AllHasNoTagError,
    ParamNotExistError,
    TagFetchError,
} from "../CustomError.js";

import { fmt, bold } from "@grammyjs/parse-mode";
import { fileLogStream } from "../LevelLog.js";

class MDecorator {
    static CusErrHanlde(
        _: Object,
        key: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value as (ctx: CusContext) => any;
        descriptor.value = async function (ctx: CusContext) {
            try {
                await originalMethod.call(this, ctx);
            } catch (err: any) {
                if (err instanceof KindNotExistError
                    || err instanceof KindAlreadyExistError
                    || err instanceof EmptyKindError
                    || err instanceof AllHasNoTagError
                    || err instanceof KindAlreadyExistError
                    || err instanceof TagFetchError
                ) {
                    ctx.replyFmt(fmt`${bold("Action fail")}: ${err.message}`);
                } else if (err instanceof ParamNotExistError) {
                    ctx.replyFmt(fmt`the command need the param:  <${bold(err.message)}>`);
                } else {
                    //... 其他错误
                    fileLogStream.write(err);
                    ctx.replyFmt(fmt`${bold("Unexpected Fail")}`);
                }
            }
        }
    };
}


export default MDecorator;
