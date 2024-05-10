const ReserveWord: {[key:string]: string} = {
    exit: ".exit",
}

class ReservedApi {
    private static rwSet: Set<string> | undefined;

    private static getSet() {
        if (this.rwSet == undefined) {
            // 遍历ReverseWord，将其value加入set
            this.rwSet = new Set<string>();
            for (const key in ReserveWord) {
                this.rwSet.add(ReserveWord[key]);
            }
        }

        return this.rwSet;
    }

    static isReservedWord(word: string) {
        return this.getSet().has(word);
    }
}

export { ReservedApi, ReserveWord };