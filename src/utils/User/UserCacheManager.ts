import SqlApi from "../Sql/SqlApi.js";
import  { levelLog, LogLevel } from "../LevelLog.js";
import UserProfile from "./UserProfile.js";

const defaultIdleTime = 1000 * 60 * 3; // 3分钟

class UserCacheManager {
    private _cache: Map<number, UserCacheItem>;
    private readonly idleTime: number; // 空闲时间阈值，单位：毫秒

    constructor(idleTime: number = defaultIdleTime) {
        this.idleTime = idleTime;
        this._cache = new Map();
    }

    private async resetTimer(chatId: number, obj: UserCacheItem) {
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

    private async getItem(chatId: number) {
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

    async PatchKind(chatId: number, kind: string, tags: string[]) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        item.profile.PatchKind(kind, tags);
    }

    async AddKind(chatId: number, kind: string) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        item.profile.AddTagKind(kind);
    }

    async RemoveKind(chatId: number, kind: string) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        item.profile.RemoveTagKind(kind);
    }

    async AddTags(chatId: number, kind: string, tags: string[]) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        return item.profile.AddTags(kind, tags);
    }

    async RmTags(chatId: number, kind: string, tags: string[]) {
        const item = await this.getItem(chatId);
        item.isWrited = true;
        return item.profile.RmTags(kind, tags);
    }

    async GetAllKinds(chatId: number) {
        const item = await this.getItem(chatId);
        return item.profile.GetAllKind();
    }

    async GetKindRandomTag(chatId: number, kind: string) {
        const item = await this.getItem(chatId);
        return item.profile.GetKindRandomTag(kind);
    }

    async GetAllRandomTag(chatId: number) {
        const item = await this.getItem(chatId);
        return item.profile.GetAllRandomTag();
    }

    async GetKindTags(chatId: number, kind: string) {
        const item = await this.getItem(chatId);
        return item.profile.GetKindTags(kind);
    }

}

export default UserCacheManager;