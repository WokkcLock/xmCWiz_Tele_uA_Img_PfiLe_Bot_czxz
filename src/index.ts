import { initBot } from "./utils/Bot/api.js";
import * as readlineSync from "readline-sync";
import { levelLog, LogLevel } from "./utils/LevelLog.js";
import DanbooruApi from "./utils/DanbooruApi.js";
import UserCacheManager from "./utils/User/UserCacheManager.js";

async function main() {
  const args = process.argv.slice(2);
  let botToken: string;

  if (args.length == 0) {
    botToken = readlineSync.question("Please input your bot token: ");
  } else {
    botToken = args[0];
  }
  const dan = await DanbooruApi.Create();
  const ucMan = new UserCacheManager();
  process.on("SIGINT", async () => {
    await ucMan.DumpAllBeforeShutdown();
    process.exit(0);
  });

  const bot = await initBot(botToken, dan, ucMan);


  bot.start();
  levelLog(LogLevel.deploy, "Bot start.");
  return;
}





main();