import { RatingEnum } from "../../type/CustomEnum.js";
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