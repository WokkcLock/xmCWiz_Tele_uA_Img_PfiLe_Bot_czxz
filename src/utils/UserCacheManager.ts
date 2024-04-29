import SqlApi from "./Sql/SqlApi.js";
import  { levelLog, LogLevel } from "./LevelLog.js";
import UserProfile from "./User/UserProfile.js";

const defaultIdleTime = 1000 * 60 * 3; // 3分钟

class UserCacheManager {
    private _cache: Map<string, UserCacheItem>;
    private readonly idleTime: number; // 空闲时间阈值，单位：毫秒

    constructor(idleTime: number = defaultIdleTime) {
        this.idleTime = idleTime;
        this._cache = new Map();
    }

    private async resetTimer(chatId: string, obj: UserCacheItem) {
        // 取消之前的定时器
        clearTimeout(obj.timer);
        obj.timer = setTimeout(() => {
            if (obj.isWrited) {
                levelLog(LogLevel.debug, `UserCache: update chatId: ${chatId}`);
                SqlApi.update(chatId,
                    obj.profile.GetJsonText());
            }
            levelLog(LogLevel.debug, `UserCache: delete chatId: ${chatId}`);
            this._cache.delete(chatId);
        },this.idleTime);
    }

    private async getItem(chatId: string) {
        const obj = this._cache.get(chatId);

        if (obj == undefined) {
            // 从数据库加载对象到内存
            const newTimer = setTimeout(() => {
                this._cache.delete(chatId);
            }, this.idleTime);
            const contentJsonText = await SqlApi.get(chatId);
            this._cache.set(chatId, {
                profile: new UserProfile(contentJsonText),
                timer: newTimer,
                isWrited: contentJsonText == undefined,
            });
            levelLog(LogLevel.debug, `UserCache: add chatId: ${chatId}`);
        }
        else {
            await this.resetTimer(chatId, obj);
        }
        return this._cache.get(chatId)!;
    }

    async DumpAllBeforeShutdown() 
    {
        // 遍历 _cache
        for (const [_, value] of this._cache) {
            clearTimeout(value.timer);
        }
        for (const [key, value] of this._cache) {
            if (value.isWrited) {
                console.log("is writed");
                await SqlApi.update(key, value.profile.GetJsonText());
            }
        }
    }

    async PatchTags(chatId: string, kind: string, tags: string[]) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        return item.profile.PatchTagKind(kind, tags);
    }

    async AddKind(chatId: string, kind: string) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        return item.profile.AddTagKind(kind);
    }

    async RemoveKind(chatId: string, kind: string) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        return item.profile.RemoveTagKind(kind);
    }

    async AddTag(chatId: string, kind: string, tag: string) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        return item.profile.AddTag(kind, tag);
    }

    async RemoveTag(chatId: string, kind: string, tag: string) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        return item.profile.RemoveTag(kind, tag);
    }

    async GetAllKinds(chatId: string) {
        const item = await this.getItem(chatId);
        return item.profile.GetAllKind();
    }

    async GetKindRandomTag(chatId: string, kind: string) {
        const item = await this.getItem(chatId);
        return item.profile.GetRandomTagWithKind(kind);
    }

    async GetAllRandomTag(chatId: string) {
        const item = await this.getItem(chatId);
        return item.profile.GetRandomTagAll();
    }

}

export default UserCacheManager;