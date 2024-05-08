import { initBot } from "./Bot/api.js";
import * as readlineSync from "readline-sync";
import { LogLevel, levelLog } from "./utils/LevelLog.js";
import { te1 } from "./te.js";

async function main() {
  const botToken = readlineSync.question("Please input your bot token: ");
  const bot = await initBot(botToken);
  bot.start();
  levelLog(LogLevel.deploy, "Bot start.");
  return;
}

main();
