import { initBot } from "./utils/Bot/api.js";
import * as readlineSync from "readline-sync";
import { levelLog, LogLevel } from "./utils/LevelLog.js";

async function main() {
  const args = process.argv.slice(2);
  let botToken: string;

  if (args.length == 0) {
    botToken = readlineSync.question("Please input your bot token: ");
  } else {
    botToken = args[0];
  }

  const bot = await initBot(botToken);


  bot.start();
  levelLog(LogLevel.deploy, "Bot start.");
  return;
}