import { startBotDevMode } from "./OldBot.js";
import CusConfig from "./utils/CusConfig.js";
import * as readlineSync from "readline-sync";
import CryptoTool from "./utils/Sql/CryptoTool.js";
import SqlApi from "./utils/Sql/SqlApi.js";
import UserCacheManager from "./utils/User/UserCacheManager.js";

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


function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const idleTime = 1000 * 5 * 1; // 1分钟
  const userCache = new UserCacheManager(idleTime);
  process.on('exit', async () => {
    console.log('process exit');
    await userCache.DumpAllBeforeShutdown();
    process.exit(0);
  }
  );
  const chatId = "334567";
  const kindStr = "test4";
  await userCache.AddKind(chatId, kindStr);
  await userCache.AddTag(chatId, kindStr, "1");
  await userCache.AddTag(chatId, kindStr, "2");
  await userCache.AddTag(chatId, kindStr, "3");

  await sleep(idleTime + 2000);

  await userCache.AddTag(chatId, kindStr, "4");


}

async function te() {
  let i = 0;
  console.log("start.");
  try {
    while (i < 5) {
      await sleep(1000);
      i++;
    }
    throw new Error("test error");
  } catch (err) {
    console.error(err);
  }
  console.log("done.");
}

te();