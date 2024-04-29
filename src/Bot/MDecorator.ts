import { Context, NextFunction } from "grammy";
import { KindNotExistError, KindAlreadyExistError, EmptyKindError, NoKindError} 
    from "../utils/User/CustomError.js";

class MDecorator 
{
    static CusErrHanlde(_: Object, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value as (ctx: Context) => any;
        descriptor.value = async function (ctx: Context) {
            try {
                await originalMethod.call(this, ctx);
            } catch (err) {
                if (err instanceof KindAlreadyExistError) {
                    ctx.reply(`Fail: Kind already exist`); 
                } else if (err instanceof KindNotExistError) {
                    ctx.reply(`Fail: Kind not exist `); 
                } else if (err instanceof EmptyKindError) {
                    ctx.reply(`Fail: Kind has no tags`);
                } else if (err instanceof NoKindError) {
                    ctx.reply(`Fail: No kind`);
                } else {
                    throw err;
                }
            }
        }
    }
}

export default MDecorator;