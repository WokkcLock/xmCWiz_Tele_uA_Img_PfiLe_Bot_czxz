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

export class NoKindError extends Error {
    constructor() {
        super(`No kind`);
        this.name = "NoKindError";
    }

}

// 设计上不会发生的错误，仅仅只是为了骗过编译器
class UnexpectedError extends Error {
    constructor (message: string) {
        super(`Unexpected Error: ${message}`);
        this.name = "UnexpectedError";
    }
}
