/*
 * @Author: Wizlec
 * @Date: 2024-07-18 08:37:44
 * @LastEditors: Wizlec
 * @LastEditTime: 2024-07-18 08:44:22
 * @FilePath: /xmCWiz_Tele_uA_Img_PfiLe_Bot_czxz/src/index.ts
 * @Description: 
 */
import { initBot } from "./Bot/index.js";
import * as readlineSync from "readline-sync";
import { fileErrorLoger, setLogLevel, levelLog, LogLevel } from "./utils/LevelLog.js";
import { exit } from "process";
import SqlApi from "./SqlApi/index.js";
import { SqliteError } from "better-sqlite3";

const sql = SqlApi.GetInstance();

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

// main();

async function te() {
  try {
    await sql.InsertKind(111, "sasas");
    // throw new Error("111");
  } catch (err) {
    if (err instanceof SqliteError) {
      if (err.code == "SQLITE_CONSTRAINT_UNIQUE") {
        // 处理过程
        console.log("命中");
      }
    }
    // console.log(typeof(err));
  }
  // await sql.InsertTags(1, new Set<string>(["bca", "baa"]));
  console.log("done..");
}

te();