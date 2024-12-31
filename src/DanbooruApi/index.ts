import AbstractFetcher from "./Fetcher/Fetcher.js";
import CurlFetcher from "./Fetcher/CurlFetcher.js";
import { LogLevel, levelLog } from "../utils/LevelLog.js";
import { asyncSleep, getRandomInt, getRatingText } from "../utils/Helper/ToolFunc.js";
import { AfterUpdateEmptyError, IdFetchError, TagFetchError } from "../utils/CustomError.js";
import { ImageFileExtEnum, RatingEnum } from "../type/CustomEnum.js";
import SqlApi from "../SqlApi/index.js";

const sql = SqlApi.GetInstance();


const DanbooruBaseApiUrl = "https://danbooru.donmai.us/posts.json";
const DanbooruGalleryBaseUrl = "https://danbooru.donmai.us/posts";
const getLimit = 30; // 每次请求限制

class DanbooruApi {
    private static _instance: DanbooruApi | undefined = undefined;

    private _fetcher: AbstractFetcher;

    private constructor(fetcher: AbstractFetcher) {
        this._fetcher = fetcher;
    }

    static async GetInstance() {
        if (DanbooruApi._instance == undefined) {
            DanbooruApi._instance = await DanbooruApi.Create();
        }
        return DanbooruApi._instance;
    }

    static async Create() {
        const fetcher = new CurlFetcher();
        await fetcher.Init();
        return new DanbooruApi(fetcher);
    }

    private async fetchDanbooruApi(params: DanbooruParams) {
        return await this._fetcher.GetJson(DanbooruBaseApiUrl, params);
    }

    private getFileExtStr(fileExtEnum: ImageFileExtEnum) {
        switch (fileExtEnum) {
            case ImageFileExtEnum.jpg:
                return "jpg";
            case ImageFileExtEnum.png:
                return "png";
            case ImageFileExtEnum.webp:
                return "webp";
            case ImageFileExtEnum.bmp:
                return "bmp";
            case ImageFileExtEnum.gif:
                return "gif";
            case ImageFileExtEnum.svg:
                return "svg";
            case ImageFileExtEnum.tiff:
                return "tiff";
            default:    // 按理说绝不会执行到这里
                throw new Error("Invalid fileExtEnum");
        }
    }

    private getSampleUrl(md5: string, fileExtEnum: ImageFileExtEnum) {
        // https://cdn.donmai.us/sample/6d/b2/sample-6db26e9cdcf02cbfa98ba7409a61d5cb.jpg
        return `https://cdn.donmai.us/sample/${md5[0] + md5[1]}/${md5[2] + md5[3]}/sample-${md5}.${this.getFileExtStr(fileExtEnum)}`;
    }

    private getOriginUrl(md5: string, fileExtEnum: ImageFileExtEnum) {
        // https://cdn.donmai.us/original/6d/b2/6db26e9cdcf02cbfa98ba7409a61d5cb.jpg
        return `https://cdn.donmai.us/original/${md5[0] + md5[1]}/${md5[2] + md5[3]}/${md5}.${this.getFileExtStr(fileExtEnum)}`;
    }

    private async canRetryFetchImg(url: string, id: number) {
        let failCount = 0;
        while (true) {
            // 最多进行3次尝试
            try {
                return await this._fetcher.GetByteFile(url);
            } catch {
                failCount++;
            }
            if (failCount < 3) {
                await asyncSleep(200 + getRandomInt(0, 500));
            } else {
                break;
            }
        }
        // 请求出错
        throw new IdFetchError(id);
    }

    private async updateTagCache(rating: RatingEnum, tag: string) {

        let paramTag: string; 
        if (rating != RatingEnum.disable) {
            paramTag = `${tag} rating:${getRatingText(rating)![0]}`;
        } else {
            paramTag = tag;
        }
        const params: DanbooruParams = {
            tags: `${paramTag} random:${getLimit}`,
        };
        levelLog(LogLevel.deploy, `Tags: ${params.tags}, Update map.`);
        let res: { [key: string]: any }[];
        let failCount = 0;
        while (failCount < 3) {
            try {
                res = (await this.fetchDanbooruApi(params)) as {
                    [key: string]: any;
                }[];
                break;
            } catch (err) {
                // ... 暂时不管
                failCount++;
                if (failCount < 3) {
                    await asyncSleep(500 + getRandomInt(0, 500));
                }
            }
        }
        if (failCount == 3) {
            // ...到达失败上界
            throw new TagFetchError(tag);
        }
        const dataList = [] as {
            md5: string,
            file_ext: ImageFileExtEnum;
            image_id: number;
        }[];
        for (const item of res!) {
            try {
                // variants[3]：sample
                // 示例url: https://cdn.donmai.us/sample/82/9e/sample-829e06771f5d86491a9b44f50bdcfa92.jpg
                // variants[4]：原图
                // 示例url: https://cdn.donmai.us/original/82/9e/829e06771f5d86491a9b44f50bdcfa92.jpg

                // 这里是获取sample图样的信息
                const fileExtStr = (item.media_asset.variants[3].file_ext as string).toLowerCase().trim();
                let fileExt: ImageFileExtEnum;
                switch (fileExtStr) {
                    case "jpg":
                        fileExt = ImageFileExtEnum.jpg;
                        break;
                    case "png":
                        fileExt = ImageFileExtEnum.png;
                        break;
                    case "webp":
                        fileExt = ImageFileExtEnum.webp;
                        break;
                    case "bmp":
                        fileExt = ImageFileExtEnum.bmp;
                        break;
                    case "gif":
                        fileExt = ImageFileExtEnum.gif;
                        break;
                    case "svg":
                        fileExt = ImageFileExtEnum.svg;
                        break;
                    case "tiff":
                        fileExt = ImageFileExtEnum.tiff;
                        break;
                    default:
                        throw new Error("Unknown image file_ext str");
                }
                dataList.push({
                    image_id: item.id,
                    md5: item.md5,
                    file_ext: fileExt,
                });
            } catch (err) {
                //* 有可能会失败，但是不管
                levelLog(
                    LogLevel.warn,
                    `id: ${item.id} media_asset.variants fail.`,
                ); // 一般来说是fail.
                continue;
            }
        }
        // 插入数据库
        await sql.InsertCaches(rating, tag, dataList);
    }

    async GetImageFromId(id: number) {
        const res = (await this.fetchDanbooruApi({
            page: `b${id + 1}`,
            limit: 1,
        })) as { [key: string]: any }[];

        return {
            // image_data: await this.getImg(res[0].media_asset.variants[3].url),
            image_data: await this.canRetryFetchImg(res[0].media_asset.variants[3].url, res[0].id),
            dan_url: `${DanbooruGalleryBaseUrl}/${res[0].id}`,
        };
    }

    async GetImageFromTag(rating: RatingEnum, tag: string) {
        let cacheItem = await sql.SelectCache(rating, tag);
        if (cacheItem == undefined) {
            // 缓存为空
            await this.updateTagCache(rating, tag);
            cacheItem = await sql.SelectCache(rating, tag);
        }

        if (cacheItem == undefined) {
            // 更新缓存后仍然为空
            throw new AfterUpdateEmptyError(tag);
        }

        const imageUrl = this.getSampleUrl(cacheItem.md5, cacheItem.file_ext);
        // const imgByte = await this.getImg(imageUrl);
        return {
            dan_url: `${DanbooruGalleryBaseUrl}/${cacheItem!.image_id}`,
            image_data: await this.canRetryFetchImg(imageUrl, cacheItem.image_id),
        }
    }
}

export default DanbooruApi;
