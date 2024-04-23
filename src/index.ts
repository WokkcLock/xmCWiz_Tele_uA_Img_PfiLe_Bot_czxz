/*
 * @Author: nomwiz nomwiz@nom.com
 * @Date: 2024-02-16 01:47:11
 * @LastEditors: Wizlec
 * @LastEditTime: 2024-04-05 23:07:18
 * @FilePath: \ImgTelebot\src\index.ts
 * @Description: a Custom image telegram bot, which get image from danbooru with tag
 */
import { startBotDevMode, startBotDeployMode } from "./Bot.js";
import CusConfig from "./utils/CusConfig.js";

async function main() {
    const cusConfig = new CusConfig("configs/configs.json");
    const args = process.argv.slice(2);

    if (args[0] == "--dev") {
        await startBotDevMode(cusConfig);
    } else if (args[0] == "--deploy") {
        await startBotDeployMode(cusConfig);
    } else {
        throw new Error(`Unknown index.js main args: ${args[0]}`)
    }
}

async function te() {
    let count = 10000;
    let i = 0;
    while (i < count) {
        
    }
}
main();