/*
 * @Author: nomwiz
 * @Date: 2024-02-16 01:47:11
 * @LastEditors: nomwiz
 * @LastEditTime: 2024-03-25 03:18:22
 * @FilePath: /ImgBot/src/utils/Fetcher/Fetcher.ts
 * @Description:
 */
import { ParsedUrlQueryInput } from "querystring";

abstract class AbstractFetcher {
  abstract GetJson(url: string, param?: ParsedUrlQueryInput): Promise<any>;

  abstract GetByteFile(
    url: string,
    params?: ParsedUrlQueryInput,
  ): Promise<Buffer>;

  abstract Init(): any;
}

export default AbstractFetcher;
