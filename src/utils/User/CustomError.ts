export class KindNotExistError extends Error {
    constructor(kind: string) {
        super(`Kind ${kind} does not exist`);
        this.name = "KindNotExistError";
    }
}

export class KindAlreadyExistError extends Error {
    constructor(kind: string) {
        super(`Kind ${kind} already exist`);
        this.name = "KindAlreadyExistError";
    }
}

export class EmptyKindError extends Error {
    constructor(kind: string) {
        super(`Kind [${kind}] has no tags`);
        this.name = "EmptyKindError";
    }
}


export class TagNotExistError extends Error {
    constructor(kind: string, tag: string) {
        super(`Tag ${tag} does not exist in kind ${kind}`);
        this.name = "TagNotExistError";
    } 
}

export class TagAlreadyExistError extends Error {
    constructor(kind: string, tag: string) {
        super(`Tag ${tag} already exist in kind ${kind}`);
        this.name = "TagAlreadyExistError";
    }
}

export class TagFetchError extends Error {
    constructor(tag: string) {
        super(`Tag ${tag} fetch error`);
        this.name = "TagFetchError";
    }
}

export class AllHasNoTagError extends Error {
    constructor() {
        super(`All kind has no tags`);
        this.name = "AllHasNoTagError";
    }
}

// 设计上不会发生的错误，仅仅只是为了骗过编译器
class UnexpectedError extends Error {
    constructor (message: string) {
        super(`Unexpected Error: ${message}`);
        this.name = "UnexpectedError";
    }
}
