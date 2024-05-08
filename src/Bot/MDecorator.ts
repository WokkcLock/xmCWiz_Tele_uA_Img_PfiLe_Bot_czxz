import { Context } from "grammy";
import {
    KindNotExistError, KindAlreadyExistError, EmptyKindError,
    TagNotExistError, TagAlreadyExistError, AllHasNoTagError
}
    from "../utils/User/CustomError.js";

class MDecorator {
    static CusErrHanlde(_: Object, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value as (ctx: Context) => any;
        descriptor.value = async function (ctx: Context) {
            try {
                await originalMethod.call(this, ctx);
            } catch (err: any) {
                switch (err.constructor) {
                    case KindNotExistError:
                    case KindAlreadyExistError:
                    case EmptyKindError:
                    case AllHasNoTagError:
                        ctx.reply(`ActionFail: ${err.message}`);
                        break;
                    default:
                        ctx.reply(`Fail: Unexpected error.`);
                }
                // if (err instanceof KindAlreadyExistError) {
                //     ctx.reply(`Action Fail: Kind already exist`);
                // } else if (err instanceof KindNotExistError) {
                //     ctx.reply(`Action Fail: Kind not exist `);
                // } else if (err instanceof EmptyKindError) {
                //     ctx.reply(`Action Fail: Kind has no tags`);
                // } else if (err instanceof NoKindError) {
                //     ctx.reply(`Action Fail: No kind`);
                // } else if (err instanceof TagAlreadyExistError) {
                //     ctx.reply(`Action Fail: Tag already exist`);
                // } else if (err instanceof TagNotExistError) {
                //     ctx.reply(`Action Fail: Tag not exist`);
                // } else {
                //     ctx.reply(`Fail: Unexpected error.`);
                // }
            }
        }
    }
}

export default MDecorator;