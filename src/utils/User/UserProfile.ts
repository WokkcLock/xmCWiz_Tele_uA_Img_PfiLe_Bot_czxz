import { KindNotExistError, KindAlreadyExistError, EmptyKindError, 
    TagAlreadyExistError, TagNotExistError, AllHasNoTagError} 
    from "./CustomError.js";

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

    PatchTagKind(kind: string, tags: string[]) {
        if (!this._tagMap.has(kind)) {
            throw new KindNotExistError(kind);
        }
        var newSet = new Set(tags);
        this._tagMap.set(kind, newSet);
    }

    RemoveTagKind(kind: string) {
        if (!this._tagMap.has(kind)) {
            throw new KindNotExistError(kind);
        }
        this._tagMap.delete(kind);
    }

    AddTag(kind: string, tag: string) {
        if (!this._tagMap.has(kind)) {
            throw new KindNotExistError(kind);
        }
        const tagSet = this._tagMap.get(kind)!;
        if (tagSet.has(tag)) {
            throw new TagAlreadyExistError(kind, tag);
        }
        tagSet.add(tag);
    }

    RemoveTag(kind: string, tag: string) {
        if (!this._tagMap.has(kind)) {
            throw new KindNotExistError(kind);
        }
        const tagSet = this._tagMap.get(kind)!;
        if (tagSet.has(tag)) {
            tagSet.delete(tag);
        }
        throw new TagNotExistError(kind, tag);
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
        return this._tagMap.keys();
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
            tags: obj
        });
    }
}

export default UserProfile;