import { RatingEnum } from "./type/CustomEnum.js";
export function isEmptyObject(obj: Object) {
    for (var _ in obj) {
        return false;
    }
    return true;
}

export function asyncSleep(interval: number) {
    return new Promise(resolve => {
        setTimeout(resolve, interval);
    });
}

export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRatingText(rating: RatingEnum) {
    switch (rating) {
        case RatingEnum.general:
            return "general";
        case RatingEnum.sensitive:
            return "sensitive";
        case RatingEnum.questionable:
            return "questionable";
        case RatingEnum.explicit:
            return "explicit";
        default:
            return undefined;
    }

}

export function shuffleCollection<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
        // 随机选择一个索引
        const j = Math.floor(Math.random() * (i + 1));

        // 交换元素
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function cleanObjUndefined<T extends object>(obj: T) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined)
    );
}