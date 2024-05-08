import { initBot } from "./Bot/api.js";
import * as readlineSync from "readline-sync";
import { LogLevel, levelLog } from "./utils/LevelLog.js";
/*
async function main() {
  const cusConfig = new CusConfig("CusConfig.json");
  const args = process.argv.slice(2);

  const botToken = readlineSync.question("Please input your bot token: ");

  if (args[0] == "--dev") {
    await startBotDevMode(cusConfig, botToken);
  } else {
    throw new Error(`Unknown index.js main args: ${args[0]}`);
  }
}
*/
async function main() {
  const botToken = readlineSync.question("Please input your bot token: ");
  const bot = await initBot(botToken);
  bot.start();
  levelLog(LogLevel.deploy, "Bot start.");
  return;
}
main();