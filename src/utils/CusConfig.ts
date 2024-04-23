import fs from "fs";

class CusConfig {
  private _name: string | undefined;
  private _apiKey: string | undefined;
  private _tags = new Map<string, string[]>();
  private _tagsTotalCount: number; // tags的总数
  public ExpressPort: number | undefined;
  public WebHookUrl: string | undefined;
  constructor(configPath: string) {
    const jsonD = JSON.parse(fs.readFileSync(configPath).toString());
    if (jsonD.danbooru.name != undefined && jsonD.danbooru.key != undefined) {
      this._name = jsonD.danbooru.name;
      this._apiKey = jsonD.danbooru.key;
    }

    const tagEntries = Object.entries(jsonD.danbooru.tags);
    this._tagsTotalCount = 0;
    for (const item of tagEntries) {
      this._tagsTotalCount += (<string[]>item[1]).length;
      this._tags.set(item[0], item[1] as string[]);
    }
    if (jsonD.express != undefined) {
      this.ExpressPort = jsonD.express.port;
      this.WebHookUrl = `https://${jsonD.express.domain}`;
    }
  }

  GetDanbooruAuthObj() {
    return {
      name: this._name,
      api_key: this._apiKey,
    };
  }

  /**
   *
   * @returns 随机返回一个tags字符串，从覆盖率角度应该是不会返回undefined的
   */
  GetRandomTag(kind: string = "") {
    const taglist = this._tags.get(kind);
    if (taglist != undefined) {
      const fp = Math.floor(Math.random() * taglist.length);
      return taglist[fp];
    }

    // 当未创建或不存在
    let fp = Math.floor(Math.random() * this._tagsTotalCount);
    for (const item of this._tags.values()) {
      if (fp >= item.length) {
        fp -= item.length;
        continue;
      } else {
        return item[fp];
      }
    }
    // 按覆盖率来说，应该是不可能执行到下面的。
    return "virtuosa_(arknights)";
  }

  GetTagsKind() {
    return this._tags.keys();
  }
}

export default CusConfig;
