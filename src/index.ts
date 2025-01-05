/*
 * @Author: Wizlec
 * @Date: 2024-07-18 08:37:44
 * @LastEditors: Wizlec
 * @LastEditTime: 2024-07-18 08:44:22
 * @FilePath: /xmCWiz_Tele_uA_Img_PfiLe_Bot_czxz/src/index.ts
 * @Description: 
 */
import { initBot } from "./Bot/index.js";
import { fileErrorLoger, setLogLevel, levelLog, LogLevel } from "./utils/LevelLog.js";
import { exit } from "process";
import "dotenv/config"
import db from "./db/index.js";


function checkEnv() {
    // 检查环境变量
    if (process.env.BOT_TOKEN == undefined) {
        levelLog(LogLevel.error, "need \"BOT_TOKEN\" enviroment var.");
        return false;
    }
    if (process.env.DB_URL == undefined) {
        levelLog(LogLevel.error,"need \"DB_URL\" enviroment var.");
        return false;
    }

    if (process.env.SOCKS_PROXY == undefined) {
        levelLog(LogLevel.deploy, "mode: no proxy, you can set \"SOCKS_PROXY\" var to set the bot proxy.")
    } else {
        levelLog(LogLevel.deploy, "mode: use proxy.")
    }

    return true;

}

async function main() {
    setLogLevel(LogLevel.debug);
    if (!checkEnv()) {
        levelLog(LogLevel.error, "env check fail, create \".env\" and set correct enviroment var.")
        return;
    }
    process.on("SIGINT", () => {
        console.log("");  // 换行
        db.$client.close();
        fileErrorLoger.clear();
        levelLog(LogLevel.deploy, "server done.");
        exit(0);
    });
    const bot = await initBot(process.env.BOT_TOKEN!, process.env.SOCKS_PROXY);
    bot.start();
    levelLog(LogLevel.deploy, "Bot start.");
    return;
}

main();