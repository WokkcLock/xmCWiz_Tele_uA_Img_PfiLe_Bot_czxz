import { Context } from "grammy";
import {
    KindNotExistError,
    KindAlreadyExistError,
    EmptyKindError,
    AllHasNoTagError,
    ParamNotExistError,
} from "../CustomError.js";

class MDecorator {
    static CusErrHanlde(
        _: Object,
        key: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value as (ctx: Context) => any;
        descriptor.value = async function (ctx: Context) {
            try {
                await originalMethod.call(this, ctx);
            } catch (err: any) {
                // switch (err.constructor) {
                //     case KindNotExistError:
                //     case KindAlreadyExistError:
                //     case EmptyKindError:
                //     case AllHasNoTagError:
                //         ctx.reply(`ActionFail: ${err.message}`);
                //         break;
                //     case ParamNotExistError:
                //         ctx.reply(`Please input the param:  \\<${err.message}\\>`, {
                //             parse_mode: "MarkdownV2",
                //         });
                //         break;
                //     default:
                //         console.error(err);
                //         ctx.reply(`Fail: Unexpected error.`);
                // }
                if (err instanceof KindNotExistError
                    || err instanceof KindAlreadyExistError
                    || err instanceof EmptyKindError
                    || err instanceof AllHasNoTagError
                ) {
                    ctx.reply(`ActionFail: ${err.message}`);
                } else if (err instanceof ParamNotExistError) {
                    ctx.reply(`Please input the param:  \\<${err.message}\\>`, {
                        parse_mode: "MarkdownV2",
                    });
                } else {
                    //... 其他错误
                    console.error(err);
                    ctx.reply(`Fail: Unexpected error.`);
                }
            }
        }
    };
}


export default MDecorator;
