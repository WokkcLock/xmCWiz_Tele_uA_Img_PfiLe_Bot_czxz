/*
 * @Author: nomwiz nomwiz@nom.com
 * @Date: 2024-02-16 01:47:11
 * @LastEditors: Wizlec
 * @LastEditTime: 2024-04-05 23:07:18
 * @FilePath: \ImgTelebot\src\index.ts
 * @Description: a Custom image telegram bot, which get image from danbooru with tag
 */
import { startBotDevMode, startBotDeployMode } from "./Bot.js";
import CusConfig from "./utils/CusConfig.js";

async function main() {
  const cusConfig = new CusConfig("CusConfig.json");
  const args = process.argv.slice(2);

  if (args[1] == undefined) {
    console.log("Please input the bot token as the second argument.");
    return;
  }

  if (args[0] == "--dev") {
    await startBotDevMode(cusConfig, args[1]);
  } else if (args[0] == "--deploy") {
    await startBotDeployMode(cusConfig, args[1]);
  } else {
    throw new Error(`Unknown index.js main args: ${args[0]}`);
  }
}

function te() {
  const args = process.argv.slice(2);
  console.log(args);
}

main();
