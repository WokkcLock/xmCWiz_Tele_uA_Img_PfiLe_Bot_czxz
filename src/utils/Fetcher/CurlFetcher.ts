/*
 * @Author: nomwiz
 * @Date: 2024-03-23 12:11:13
 * @LastEditors: nomwiz nomwiz@nom.com
 * @LastEditTime: 2024-03-25 03:17:59
 * @FilePath: /ImgBot/src/utils/Fetcher/CurlFetcher.ts
 * @Description: 
 */


import AbstractFetcher from "./Fetcher.js";
import { isEmptyObject } from "../ToolFunc.js";
import { exec } from "child_process";
import queryString, { ParsedUrlQueryInput } from "querystring";

class CurlFetcher extends AbstractFetcher {
    constructor() {
        super();
    }

    Init() { }

    private static preFormatUrl(url: string, params: ParsedUrlQueryInput) {
        //* 包上双引号，不让类似括号的特殊符号导致错误
        return isEmptyObject(params) ? `"${url}"` : `"${url}?${queryString.stringify(params)}"`;
    }


    async GetJson(url: string, params: ParsedUrlQueryInput = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            //* -s: 不输出错误和进度信息，这主要是为了回避if(stderr)在正常情况也会出错
            exec(`curl -s ${CurlFetcher.preFormatUrl(url, params)}`, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`执行 curl 命令时发生错误: ${error.message}`));
                    return;
                }
                if (stderr) {
                    reject(new Error(stderr));
                    return;
                }
                //* 和cycletls不同, curl请求的数据需要手动反序列化
                resolve(JSON.parse(stdout));
            });
        });
    }

    async GetByteFile(url: string, params: ParsedUrlQueryInput = {}): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            //* -s: 不输出错误和进度信息，这主要是为了回避if(stderr)在正常情况也会出错
            const command = `curl -s ${CurlFetcher.preFormatUrl(url, params)}`;
            exec(command, { encoding: 'binary' }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`执行 curl 命令时发生错误: ${error.message}`));
                    return;
                }
                if (stderr) {
                    reject(new Error(stderr));
                    return;
                }
                resolve(Buffer.from(stdout, 'binary'));
            });
        });
    }
}

export default CurlFetcher;