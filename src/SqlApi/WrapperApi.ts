import SqlSelectApi from "./SelectApi.js";
import SqlInertApi from "./InsertApi.js";
import { RatingEnum } from "../type/CustomEnum.js";
import { ClientStateEnum } from "../type/CustomEnum.js";

class SqlWrapperApi {
    // 查询user表 ，不存在则会插入后返回
    static async GetSession(chatId: number) {
        const ret = await SqlSelectApi.SelectUser(chatId);
        if (ret != undefined) {
            return ret;
        }
        await SqlInertApi.InsertUser(chatId);
        return {
            rating: RatingEnum.disable,
            state: ClientStateEnum.default,
            actionKindId: -1,
        };
    }
}

export default SqlWrapperApi;