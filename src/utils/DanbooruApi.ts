import AbstractFetcher from "./Fetcher/Fetcher.js";
import CurlFetcher from "./Fetcher/CurlFetcher.js";
import { LogLevel, levelLog } from "./LevelLog.js";
import { asyncSleep, getRandomInt } from "./ToolFunc.js";
import { TagFetchError } from "./CustomError.js";
import { ImageFileExtEnum } from "../type/CustomEnum.js";
import { assert } from "console";
import sql from "./Sql";


const DanbooruBaseApiUrl = "https://danbooru.donmai.us/posts.json";
const DanbooruGalleryBaseUrl = "https://danbooru.donmai.us/posts";
const getLimit = 7; // 每次请求限制

class DanbooruApi {
    private _fetcher: AbstractFetcher;

    private constructor(fetcher: AbstractFetcher) {
        this._fetcher = fetcher;
    }

    static async Create() {
        const fetcher = new CurlFetcher();
        await fetcher.Init();
        return new DanbooruApi(fetcher);
    }

    private getImg(url: string) {
        return this._fetcher.GetByteFile(url);
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

    async updateTagCache(rating: Rating, tag: string) {
        let paramTag = rating == undefined ? tag : `${tag} rating:${rating}`;
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
        sql.InsertCache(rating, tag, dataList);
    }

    async GetImageFromId(id: number) {
        const res = (await this.fetchDanbooruApi({
            page: `b${id + 1}`,
            limit: 1,
        })) as { [key: string]: any }[];

        try {
            return {
                image_data: await this.getImg(res[0].media_asset.variants[3].url),
                dan_url: `${DanbooruGalleryBaseUrl}/${res[0].id}`,
            };
        } catch {
            throw new Error("Get image from id.");
        }
    }

    async GetImageFromTag(rating: Rating, tag: string) {
        let cacheItem = sql.SelectSingleCache(rating, tag);
        if (cacheItem == undefined) {
            // 更新后再次尝试
            await this.updateTagCache(rating, tag);
            cacheItem = sql.SelectSingleCache(rating, tag);
        }
        assert(cacheItem != undefined);
        const imageUrl = this.getSampleUrl(cacheItem!.md5, cacheItem!.file_ext);
        const imgByte = await this.getImg(imageUrl);
        return {
            dan_url: `${DanbooruGalleryBaseUrl}/${cacheItem!.image_id}`,
            image_data: imgByte,
        }
    }
}

export default DanbooruApi;
