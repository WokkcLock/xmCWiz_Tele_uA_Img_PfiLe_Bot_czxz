
export class KindNotExistError extends Error {
    constructor(kind: string) {
        super(`[Kind] ${kind}, does not exist`);
        this.name = "KindNotExistError";
    }
}

export class KindAlreadyExistError extends Error {
    constructor(kind: string) {
        super(`Kind: ${kind}, already exist`);
        this.name = "KindAlreadyExistError";
    }
}

export class KindNameTooLongError extends Error {
    constructor(kind: string) {
        super(`the name: ${kind}, too long`);
        this.name = "KindNameTooLongError";
    }
}

export class EmptyKindError extends Error {
    constructor(kind: string) {
        super(`[Kind]: ${kind}, has no tags`);
        this.name = "EmptyKindError";
    }
}

export class TagLenTooLongError extends Error {
    constructor(tag: string) {
        super(`[tag]: ${tag}, len too long (len <= 50)`);
    }
}


// danbooru相关
export class TagFetchError extends Error {
    constructor(tag: string) {
        super(`Tag: ${tag}, fetch error. This tag may be invalid, you can use /rm_tags to remove it.`);
        this.name = "TagFetchError";
    }
}

export class IdFetchError extends Error {
    constructor(id: number) {
        super(`Image_id: ${id}, fetch fail.`);
        this.name = "IdFetchError";
    }
}

export class AfterUpdateEmptyError extends Error {
    constructor(tag: string) {
        super(`tag: ${tag}, update but can't fetch`);
        this.name = "AfterUpdateEmptyError";
    }
}

// 设计上不会发生的错误，仅仅只是为了骗过编译器
class UnexpectedError extends Error {
    constructor (message: string) {
        super(`Unexpected Error: ${message}`);
        this.name = "UnexpectedError";
    }
}