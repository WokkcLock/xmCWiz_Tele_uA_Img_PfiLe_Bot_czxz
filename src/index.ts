import { initBot } from "./Bot/api.js";
import * as readlineSync from "readline-sync";
import { levelLog, LogLevel } from "./utils/LevelLog.js";

async function main() {
  const botToken = readlineSync.question("Please input your bot token: ");
  const bot = await initBot(botToken);

  bot.start();
  levelLog(LogLevel.deploy, "Bot start.");
  return;
}

main();
