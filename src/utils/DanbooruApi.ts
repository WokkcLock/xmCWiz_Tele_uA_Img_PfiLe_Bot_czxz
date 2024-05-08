import AbstractFetcher from "./Fetcher/Fetcher.js";
import CurlFetcher from "./Fetcher/CurlFetcher.js";
import { LogLevel, levelLog } from "./LevelLog.js";
import fs from 'fs';
import { asyncSleep } from "./ToolFunc.js";
import { TagFetchError } from "./User/CustomError.js";

const DanbooruBaseApiUrl = 'https://danbooru.donmai.us/posts.json';
const getLimit = 20;    // 每次请求限制

class DanbooruApi {
    private _fetcher: AbstractFetcher;
    private _authObj: { login: string, api_key: string } | undefined;
    private _tagsUrlCache = new Map<string, { url: string, ext: string, id: number, source_url: string }[]>();
    private _rating: Rating | undefined;

    private constructor(fetcher: AbstractFetcher) {
        this._fetcher = fetcher;
    }

    static async Create() {
        const fetcher = new CurlFetcher();
        await fetcher.Init();
        return new DanbooruApi(fetcher);
    }

    private async getImg(url: string) {
        return (await this._fetcher.GetByteFile(url));
    }

    private async fetchDanbooruApi(params: DanbooruParams) {
        return await this._fetcher.GetJson(DanbooruBaseApiUrl, params);
    }

    private async updateTagsMap(tagsWithRating: string) {

        const params: DanbooruParams = {
            tags: `${tagsWithRating} random:${getLimit}`,
            // random: true,
            // limit: 20,
            // limit: 2,
        };
        if (this._authObj != undefined) {
            params.login = this._authObj.login;
            params.api_key = this._authObj.api_key;
        }
        levelLog(LogLevel.deploy, `Tags: ${params.tags}, Update map.`);
        const res = await this.fetchDanbooruApi(params) as { [key: string]: any }[];
        const dataList = [] as { url: string, ext: string, id: number, source_url: string }[];
        for (const item of res) {
            try {
                dataList.push({
                    id: item.id,
                    url: item.media_asset.variants[3].url,  // url
                    ext: item.media_asset.variants[3].file_ext,
                    source_url: item.file_url      // 源图链接
                })
            } catch (err) {
                //* 有可能会失败，但是不管
                levelLog(LogLevel.warn, `id: ${item.id} media_asset.variants fail.`);   // 一般来说是fail.
                fs.appendFileSync('Dan_er.json', JSON.stringify(item));
                continue;
            }
        }
        this._tagsUrlCache.set(tagsWithRating, dataList);
        return dataList;
    }

    private async getFromTagsMap(tags: string) {
        if (this._rating != undefined) {
            tags = `${tags} rating:${this._rating}`;
        }
        let failCount = 0;
        let cacheList = this._tagsUrlCache.get(tags);
        if (cacheList == undefined || cacheList.length <= 0) {
            while (true) {
                cacheList = await this.updateTagsMap(tags);
                // 下面这里写的不是很严谨,总的来说还是失败3次报错
                if (cacheList.length <= 0) {
                    failCount++;
                    if (failCount >= 2) {
                        levelLog(LogLevel.error, `update tags:${tags}, meet the fail limit.`);
                        throw new TagFetchError(tags);
                    }
                } else {
                    // 就算是成功也需要break
                    await asyncSleep(1000);
                    break;
                }
                await asyncSleep(1000);
            }
        }


        const ret = cacheList.pop()!;
        return ret;
    }

    EnableAuth(name: string, apiKey: string) {
        this._authObj = {
            login: name,
            api_key: apiKey
        };
    }

    DisableAuth() {
        if (this._authObj == undefined)
            return;
        this._authObj = undefined;
    }

    SetRating(rating: Rating) {
        this._rating = rating;
    }

    GetRating() {
        switch (this._rating) {
            case 'g':
                return 'general';
            case 's':
                return 'sensitive';
            case 'q':
                return 'questionable';
            case 'e':
                return  'explicit';      
        }
        return undefined;
    }

    DisableRating() {
        this._rating = undefined;
    }

    async GetImageFromTags(tags: string) {
        const ret = await this.getFromTagsMap(tags);
        return {
            data: await this.getImg(ret.url),
            ext: ret.ext,
            id: ret.id,
            source_url: ret.source_url,
        }
    }

    async GetImageFromId(id: number) {
        const res = await this.fetchDanbooruApi({
            page: `b${id + 1}`,
            limit: 1,
        }) as { [key: string]: any }[];

        try {
            return {
                data: await this.getImg(res[0].media_asset.variants[3].url),
                ext: res[0].media_asset.variants[3].file_ext,
                id: res[0].id,
                source_url: res[0].file_url,
            }
        } catch {
            throw new Error('Get image from id.');
        }

    }

}

export default DanbooruApi;