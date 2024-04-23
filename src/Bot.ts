import {
  Bot,
  webhookCallback,
  CommandContext,
  Context,
  InputFile,
} from "grammy";
import CusConfig from "./utils/CusConfig.js";
import DanbooruApi from "./utils/DanbooruApi.js";
import { LogLevel, levelLog } from "./utils/LevelLog.js";
import { formatMarkDownStr } from "./utils/ToolFunc.js";
import express from "express";

/**
 * @description: 进行bot的除了部署以外的初始化
 * @param {CusConfig} cusConfig 配置文件
 * @return {Bot<Context, Api<RawApi>>} bot 返回的bot
 */
async function initBot(cusConfig: CusConfig, botToken: string) {
  const dan = await DanbooruApi.Build();
  const bot = new Bot(botToken);
  // 预定义为s级
  dan.SetRating("s");

  //* 生成tag random 的回调
  const imgCBGenerate = (tagKind: string = "") => {
    return async (ctx: CommandContext<Context>) => {
      try {
        const tag = cusConfig.GetRandomTag(tagKind);
        const ret = await dan.GetImageFromTags(tag);
        await ctx.replyWithPhoto(new InputFile(ret.data), {
          caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMarkDownStr(tag)}_\n[file\\_url](${formatMarkDownStr(ret.source_url)})`,
          // tag中可能带有 ( ) _这三个符号，会导致markdown parse失败，要转义
          parse_mode: "MarkdownV2",
        });
      } catch (err) {
        levelLog(LogLevel.error, err);
        ctx.reply("send image fail.");
      }
    };
  };

  //* keyboard列表生成
  const keyBoardList = [] as { text: string }[][];
  let rowKeyBoardList = [] as { text: string }[];
  for (const kind of cusConfig.GetTagsKind()) {
    rowKeyBoardList.push({ text: `/${kind}` });
    if (rowKeyBoardList.length >= 2) {
      keyBoardList.push(rowKeyBoardList);
      rowKeyBoardList = [];
    }
  }
  if (rowKeyBoardList.length > 0) {
    keyBoardList.push(rowKeyBoardList);
  }

  const commandsMap = new Map<string, { help: string }>();

  commandsMap.set("`/img_ran`", { help: "random image" });
  for (const kind of cusConfig.GetTagsKind()) {
    commandsMap.set(`\`/${kind}\``, {
      help: `random ${formatMarkDownStr(kind)} tags image`,
    });
    bot.command(kind, imgCBGenerate(kind));
  }
  commandsMap.set("`/set_rating`", { help: "set the image rating" });
  commandsMap.set("`/tag <image_tags>`", {
    help: "get image through your custom tag",
  });
  commandsMap.set(`\`/id <image_id>\``, {
    help: "get image through the image id",
  });

  //* 处理commands即/开头的命令,例子: /start
  bot.command("start", (ctx) => {
    // ctx.reply, sendMessage的语法糖，省去了指定chatIdchatId
    let helpMsg: string = "";
    for (const item of commandsMap.entries()) {
      helpMsg += `${item[0]}:     *${item[1].help}*\n`;
    }

    ctx.reply(helpMsg, {
      reply_markup: {
        keyboard: keyBoardList,
        resize_keyboard: true, // 重设按钮大小，能让显示的按钮大小变得合理，建议开启
      },
      parse_mode: "MarkdownV2",
    });
  });

  // bot.command("img_ran", imgCBGenerate());
  // bot.command("img_ark", imgCBGenerate('arknights'));
  // bot.command("img_artist", imgCBGenerate('artists'));

  bot.command("set_rating", (ctx) => {
    ctx.reply(
      `*Now rating*: _${dan.GetRating()}_\n*optional*: general, sensitive, questionable, explicit`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "general", callback_data: "general" },
              { text: "sensitive", callback_data: "sensitive" },
              { text: "questionable", callback_data: "questionable" },
              { text: "explicit", callback_data: "explicit" },
              { text: "disable", callback_data: "disable" },
            ],
          ],
          resize_keyboard: true,
        },
        parse_mode: "MarkdownV2",
      },
    );
  });

  bot.command("tag", async (ctx) => {
    // `item` 将被赋值为 `apple pie` ， 如果一个用户输入了 `/add apple pie`
    const tag = ctx.match;
    const reg = /^\S+$/g;
    if (!reg.test(tag)) {
      ctx.reply("*Your input tags invalid, please check danbooru*", {
        parse_mode: "MarkdownV2",
      });
      return;
    }

    try {
      const ret = await dan.GetImageFromTags(tag);
      await ctx.replyWithPhoto(new InputFile(ret.data), {
        caption: `\n*image id*: _${ret.id}_\n*tags*: _${formatMarkDownStr(tag)}_\n${formatMarkDownStr(ret.source_url)}`,
        parse_mode: "MarkdownV2",
      });
    } catch (err) {
      levelLog(LogLevel.error, err);
      ctx.reply(`tag: ${tag}, send fail`);
    }
  });

  bot.command("id", async (ctx) => {
    const id = ctx.match;
    const reg = /\d+/g;
    if (!reg.test(id)) {
      ctx.reply("*Your input id invalid, only number*", {
        parse_mode: "MarkdownV2",
      });
      return;
    }

    try {
      const ret = await dan.GetImageFromId(parseInt(id));
      await ctx.replyWithPhoto(new InputFile(ret.data), {
        caption: ret.source_url,
      });
    } catch (err) {
      levelLog(LogLevel.error, err);
      ctx.reply(`id: ${id}, send fail`);
    }
  });

  //* 对query: callback_data的处理, 上面的内联按钮就是
  bot.on("callback_query:data", async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    switch (callbackData) {
      case "general":
      case "sensitive":
      case "questionable":
      case "explicit":
        dan.SetRating(callbackData[0] as Rating);
        await ctx.answerCallbackQuery(
          `The Rating has been set: ${callbackData}`,
        );
        // 处理 Option 4 的逻辑
        break;
      case "disable":
        dan.DisableRating();
        await ctx.answerCallbackQuery("The Rating has been disable");
        break;
      default:
        await ctx.answerCallbackQuery("Invalid option");
        return;
    }
  });

  return bot;
}

/**
 * @description: 以长轮询方式启动bot
 * @param {CusConfig} cusConfig 配置文件
 * @return {*}
 */
async function startBotDevMode(cusConfig: CusConfig, botToken: string) {
  const bot = await initBot(cusConfig, botToken);
  console.log("init bot done.");
  // 确保之前设置的webhook删除，再以poll模式运行
  // bot.api.deleteWebhook().then(res => {
  //     bot.start();
  //     levelLog(LogLevel.deploy, "Bot start, Mode: Polling");
  // });
  bot.start();
}

/**
 * @description: 以webhook形式启动bot
 * @param {CusConfig} cusConfig 配置文件
 * @return {*}
 */
async function startBotDeployMode(cusConfig: CusConfig, botToken: string) {
  if (cusConfig.WebHookUrl == undefined || cusConfig.ExpressPort == undefined) {
    throw new Error("Webhook config is invalid.");
  }

  // bot初始化
  const bot = await initBot(cusConfig, botToken);

  // express初始化
  const app = express();
  app.use(express.json());

  // 设置bot中间件
  app.use(webhookCallback(bot, "express"));

  // 启用express监听
  app.listen(cusConfig.ExpressPort);

  // 设置webhook
  bot.api.setWebhook(cusConfig.WebHookUrl!);
  levelLog(LogLevel.deploy, "Bot start, Mode: Webhook");
}

export { startBotDevMode, startBotDeployMode };
