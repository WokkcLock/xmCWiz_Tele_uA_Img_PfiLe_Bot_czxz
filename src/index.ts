/*
 * @Author: Wizlec
 * @Date: 2024-07-18 08:37:44
 * @LastEditors: Wizlec
 * @LastEditTime: 2024-07-18 08:44:22
 * @FilePath: /xmCWiz_Tele_uA_Img_PfiLe_Bot_czxz/src/index.ts
 * @Description: 
 */
import { initBot } from "./utils/Bot/api.js";
import * as readlineSync from "readline-sync";
import { fileLogStream, setLogLevel ,levelLog, LogLevel } from "./utils/LevelLog.js";
import { exit } from "process";
import SqlApi from "./utils/Sql/SqlApi.js";

async function main() {
  const args = process.argv.slice(2);
  let botToken: string;
  setLogLevel(LogLevel.debug);
  /* 
  if (args.length == 0) {
    botToken = readlineSync.question("Please input your bot token: ");
  } else {
    botToken = args[0];
  }
  */
  const sql = new SqlApi();

  process.on("SIGINT", () => {
    console.log("");  // 换行

    fileLogStream.close();
    sql.CloseDb();

    levelLog(LogLevel.deploy, "server done.");
    exit(0);
  });

  botToken = "6674632195:AAGJkpv30CCIig-sTj2Qa4mPUfJ94oEqAsA";  
  const bot = await initBot(botToken, sql);
  bot.start();
  levelLog(LogLevel.deploy, "Bot start.");
  return;
}

main();