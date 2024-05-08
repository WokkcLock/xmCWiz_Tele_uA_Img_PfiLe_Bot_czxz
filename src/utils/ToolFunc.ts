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

/**
 * @description: 鉴于markdown字符串有较多保留字符串，使用一个统一的函数进行转义处理
 * @param inputStr 
 */
export function formatMdStr(inputStr: string) {
    // 大小括号
    // _
    // .
    return inputStr.replace(/[\_\(\)\.\[\]]/g, "\\$&");
}
