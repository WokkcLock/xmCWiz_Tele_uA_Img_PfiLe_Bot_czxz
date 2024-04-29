import { KindNotExistError, KindAlreadyExistError, EmptyKindError, 
    NoKindError } from "./CustomError.js";


class UserProfile {
    private _tags: Map<string, Set<string>>;
    private _totalTagsCount: number;
    constructor(contentText: string | undefined) {
        // 将contentText反序列化
        if (contentText == undefined) {
            this._tags = new Map();
            this._totalTagsCount = 0;
            return;
        }
        const obj = JSON.parse(contentText);
        // 遍历obj
        this._tags = new Map();
        this._totalTagsCount = 0;
        const tags = obj.tags;
        if (tags != undefined) {
            for (const key in tags) {
                this._tags.set(key, new Set(tags[key] as string[]));
                this._totalTagsCount += tags[key].length;
            }
        }
    }

    AddTagKind(newKind: string) {
        if (this._tags.has(newKind)) {
            throw new KindAlreadyExistError(newKind);
        }
        this._tags.set(newKind, new Set());
    }

    PatchTagKind(kind: string, tags: string[]) {
        if (!this._tags.has(kind)) {
            throw new KindNotExistError(kind);
        }
        var newSet = new Set(tags);
        this._totalTagsCount = this._totalTagsCount - this._tags.get(kind)!.size + newSet.size;
        this._tags.set(kind, newSet);
    }

    RemoveTagKind(kind: string) {
        if (!this._tags.has(kind)) {
            throw new KindNotExistError(kind);
        }
        this._totalTagsCount -= this._tags.get(kind)!.size;
        this._tags.delete(kind);
    }

    AddTag(kind: string, tag: string) {
        if (!this._tags.has(kind)) {
            throw new KindNotExistError(kind);
        }
        const tagSet = this._tags.get(kind)!;
        this._totalTagsCount++;
        tagSet.add(tag);
    }

    RemoveTag(kind: string, tag: string) {
        if (!this._tags.has(kind)) {
            throw new KindNotExistError(kind);
        }
        const tagSet = this._tags.get(kind)!;
        this._totalTagsCount--;
        tagSet.delete(tag);
    }


    GetKindRandomTag(kind: string = "") {
        const tagSet = this._tags.get(kind);
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
        const allKind = [...this.GetAllKind()];
        if (allKind.length == 0) {
            throw new NoKindError();
        }
        const randomIndex = Math.floor(Math.random() * allKind.length);
        return this.GetKindRandomTag(allKind[randomIndex]);
    }
    

    GetAllKind() {
        return this._tags.keys();
    }

    GetJsonText() {
        let obj = Object.create(null);
        for (const [k, v] of this._tags) {
            obj[k] = Array.from(v);
        }
        return JSON.stringify({
            tags: obj
        });
    }
}

export default UserProfile;