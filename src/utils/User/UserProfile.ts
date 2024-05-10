import {
    KindNotExistError,
    KindAlreadyExistError,
    EmptyKindError,
    TagAlreadyExistError,
    TagNotExistError,
    AllHasNoTagError,
} from "../CustomError.js";

class UserProfile {
    private _tagMap: Map<string, Set<string>>;
    constructor(contentText: string | undefined) {
        // 将contentText反序列化
        if (contentText == undefined) {
            this._tagMap = new Map();
            return;
        }
        const obj = JSON.parse(contentText);
        // 遍历obj
        this._tagMap = new Map();
        const tags = obj.tags;
        if (tags != undefined) {
            for (const key in tags) {
                this._tagMap.set(key, new Set(tags[key] as string[]));
            }
        }
    }

    AddTagKind(newKind: string) {
        if (this._tagMap.has(newKind)) {
            throw new KindAlreadyExistError(newKind);
        }
        this._tagMap.set(newKind, new Set());
    }

    IsKindExist(kind: string) {
        return this._tagMap.has(kind);
    }

    PatchKind(kind: string, tags: string[]) {
        var newSet = new Set(tags);
        this._tagMap.set(kind, newSet);
        return newSet.size;
    }

    RemoveTagKind(kind: string) {
        if (!this._tagMap.has(kind)) {
            throw new KindNotExistError(kind);
        }
        this._tagMap.delete(kind);
    }

    AddTags(kind: string, tags: string[]) {
        const tagSet = this._tagMap.get(kind)!;
        let ret = 0
        for (const tag of tags) {
            if (!tagSet.has(tag)) {
                tagSet.add(tag);
                ret++;
            }
        }
        return ret;
    }
    RmTags(kind: string, tags: string[]) {
        const tagSet = this._tagMap.get(kind)!;
        let ret = 0;
        for (const tag of tags) {
            if (tagSet.has(tag)) {
                tagSet.delete(tag);
                ret++;
            }
        }
        return ret;
    }

    GetKindRandomTag(kind: string) {
        const tagSet = this._tagMap.get(kind);
        if (tagSet == undefined) {
            throw new KindNotExistError(kind);
        }
        let i = 0;
        const randomIndex = Math.floor(Math.random() * tagSet.size);
        for (let item of tagSet) {
            if (i == randomIndex) {
                return item;
            }
            i++;
        }
        // kind内没有tag
        throw new EmptyKindError(kind);
    }

    GetAllRandomTag() {
        const allKind = [] as string[];
        for (const key of this._tagMap.keys()) {
            if (key.length > 0) {
                allKind.push(key);
            }
        }
        if (allKind.length == 0) {
            throw new AllHasNoTagError();
        }
        const randomIndex = Math.floor(Math.random() * allKind.length);
        const kind = allKind[randomIndex];
        return [kind, this.GetKindRandomTag(kind)];
    }

    GetAllKind() {
        return [...this._tagMap.keys()];
    }

    GetKindTags(kind: string) {
        const tagSet = this._tagMap.get(kind);
        if (tagSet == undefined) {
            throw new KindNotExistError(kind);
        }
        return [...tagSet];
    }

    GetJsonText() {
        let obj = Object.create(null);
        for (const [k, v] of this._tagMap) {
            obj[k] = Array.from(v);
        }
        return JSON.stringify({
            tags: obj,
        });
    }
}

export default UserProfile;
