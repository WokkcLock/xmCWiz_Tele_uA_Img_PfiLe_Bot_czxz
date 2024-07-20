export function isEmptyObject(obj: Object) {
    for (var key in obj) {
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