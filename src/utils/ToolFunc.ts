/*
 * @Author: nomwiz nomwiz@nom.com
 * @Date: 2024-02-16 01:47:11
 * @LastEditors: nomwiz
 * @LastEditTime: 2024-03-26 23:28:02
 * @FilePath: /ImgBot/src/utils/ToolFunc.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
export function formatMarkDownStr(inputStr: string) {
    // 大小括号
    // _
    // .
    return inputStr.replace(/[\_\(\)\.\[\]]/g, "\\$&");
}
