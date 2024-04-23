import fs from 'fs';
import AbstractFetcher from './utils/Fetcher/Fetcher.js';
import { asyncSleep } from './utils/ToolFunc.js';
import DanbooruApi from './utils/DanbooruApi.js';
import CusConfig from './utils/CusConfig.js';


const headers = {
    "User-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
}


// export function test1() {
//     const params = {
//         tags: 'dusk_(arknights) rating:safe',
//         // limit: 5,
//         page: 1,
//     };
//     const apiUrl = 'https://konachan.com/post.json';
//     request.get(apiUrl).set(headers).query(params).then(res => {
//         fs.writeFileSync('5.json', res.text);
//     })
// }

// export function test2() {
//     const url = 'https://konachan.com/post.json?tags=kochiya_sanae+rating:safe&page=1';
//     request.get(url).set(headers).then(res => {
//         fs.writeFileSync('3.json', res.text);
//     })
// }

// export function test3() {
//     const url = 'https://konachan.com/post.json?tags=dusk_(arknights)+rating:safe&page=1';
//     request.get(url).set(headers).then(res => {
//         fs.writeFileSync('4.json', res.text);
//     })
// }

// export function getImgTest() {
//     const url = 'https://konachan.com/jpeg/e8d6176e2059f0d873ad8331910be3d1/Konachan.com%20-%20354828%20arknights%20black_hair%20chinese_clothes%20chinese_dress%20dress%20dusk_%28arknights%29%20gawako%20horns%20long_hair%20red_eyes%20sketch.jpg';
//     request.get(url).set(headers).then(res => {
//         fs.writeFileSync('1.jpg', res.body);
//     });
// }

// export function danTest1() {
//     const danUrl = 'https://danbooru.donmai.us/posts.json';
//     const danApiKey = 'irK67PHvCZ7vhHX8WdVWGF49';
//     const params = {
//         // tags: 'dusk_(arknights) rating:safe',
//         tags: 'dusk_(arknights)',
//         limit: 5,
//         // page: 1,
//     };

//     const url = 'https://danbooru.donmai.us/posts.json?tags=dusk_(arknights)&limit=5';
//     // request.get(danUrl).set(headers).query(params).then(res => {
//     //     fs.writeFileSync('4.json', res.text);
//     // })
//     const headers = {
//         "User-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//         "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//         'Cookie': 'testbooru_session=hS4wq7LLgkGdG5DPI2c6SQLD5onEzY0rXkNEGeEAV2lgv2pfp8Udtww8v%2B5hFtycXAkYvc7X7zieuuv%2B8VAiyiRTdBoKMO9HUPTbeTI%2FGqP7TfDVQXVsIByH5oB%2FbkLUwU7g7BSpsRsl54Pk0F8o%2BC4CD7PNTrxPKe4WOwv9xGxg19vftAQPhfjL0SRFhbBYpmghGK2r3s4cP%2F75sDsCt%2FTQCHwObHdsF2UcdHT265mWfqy%2FTqK0wUiQ%2BjqhDzC%2FkRQWbVJpEzg4Bz4EvMmXjV7pbXPhvej6c%2BsAous4svGpUR37TyHFyXPSYuo18tkeos5p37KKzhqY8%2B3%2FAQFEftgrfK%2FB6H1FxvJCEgYF%2BRbgvs4W7Xgob1rQh9sPwNOJ3%2FE6--U84RRUaukUVmeaY8--Icq0vqI5KO4SMVzHDhWEFA%3D%3D; _danbooru2_session=KOzKqKwo5KiH3Cg1XKqiVFuDFD168yqEjQtbhYNcHwGGS1iQbJFTbu0hPM%2Fd8OrlYrEWkPEKoNH15YsbbeE%2BlYLGiRleAw%2B2Lwunn4JoeH3XGW5t5Ak1WliLr6vYCdguMfbERauXs%2BSNB4EnTEpbgUFyvGVN%2F2nBFL5Ny5YeJNwLWCzqSHbcMPgeRwrvsixUHOCJBzogv0dHZQ2K0DtDa5M%2B9NP%2Fqw7TYvVkVPOEnbmjWn282S%2F%2F9OcxU2Hjmj2ZpPsGKjbcHuFUSfMduUhmgg2KbqIk2vgJzNfqFxk6gXzpUHqoYtuzEfnJaAz7GyDqyz%2BCYQcijyGy3RoWwQ%2BeAn8PgtxdX6U6G6RaaXEd6E1M3ExfvaPVyCSVsicN1VTihgR3xCY3uq4CTlSMgUa3CJmzTB1Z2mKnVM1QRlnfTV5ksZHJAwCnWM6kGvg6ZqBOStcl1%2F%2FEKfwrbbo772f%2BAHP0wzkPIy71dmxd3PApuf%2BYTX2xnqgFzm8pXCY%3D--1GczIapP%2BamfI6Y7--okvTJfM%2F73W4APPkGw0Dpw%3D%3D',
//     }
//     request.get(url).set(headers).then(res => {
//         console.log(res.text);
//     })
// }

export function formatJsonTe() {
    const jsonD = JSON.parse(fs.readFileSync("4.json").toString());
    for (const item of jsonD) {
        console.log(item.file_url);
    }
}


export async function danApiTest1() {
    const dan = await DanbooruApi.Build();

    const func1 = async (filename: string, tags: string) => {
        const ret = await dan.GetImageFromTags(tags);
        fs.writeFileSync(`${filename}.${ret.ext}`, ret.data);
        console.log(`id: ${ret.id}, ext: ${ret.ext}`);
    }
    dan.SetRating('s');
    await func1('1', 'dusk_(arknights)'); 
    await asyncSleep(1000);
    await func1('2', 'dusk_(arknights)'); 
    await asyncSleep(1000);
    await func1('3', 'dusk_(arknights)'); 
}

export function cusConfigTe1() {
    const cusConfig = new CusConfig('configs/configs.json');
    console.log(cusConfig.GetRandomTag());
    console.log(cusConfig.GetRandomTag('arknights'));
    console.log(cusConfig.GetRandomTag('artists'));
    console.dir(cusConfig.GetDanbooruAuthObj());
}