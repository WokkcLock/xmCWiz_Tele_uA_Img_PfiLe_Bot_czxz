/*
 * @Author: Wizlec
 * @Date: 2024-07-18 08:37:44
 * @LastEditors: Wizlec
 * @LastEditTime: 2024-07-18 08:44:22
 * @FilePath: /xmCWiz_Tele_uA_Img_PfiLe_Bot_czxz/src/index.ts
 * @Description: 
 */
import initBot from "./utils/Bot";
import * as readlineSync from "readline-sync";
import { fileErrorLoger, setLogLevel ,levelLog, LogLevel } from "./utils/LevelLog.js";
import { exit } from "process";
import sql from "./utils/Sql";

async function main() {
  const args = process.argv.slice(2);
  let botToken: string;
  setLogLevel(LogLevel.debug);
  if (args.length == 0) {
    botToken = readlineSync.question("Please input your bot token: ");
  } else {
    botToken = args[0];
  }

  process.on("SIGINT", () => {
    console.log("");  // 换行
    sql.CloseDb();
    fileErrorLoger.clear();
    levelLog(LogLevel.deploy, "server done.");
    exit(0);
  });
  const bot = await initBot(botToken);
  bot.start();
  levelLog(LogLevel.deploy, "Bot start.");
  return;
}

main();