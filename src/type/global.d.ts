type FsPayload = {
    cmd: string,
    [key: string]: any,
}

type DanbooruParams = {
    tags?: string,       // tags
    limit?: number,     // 限制输出的数量
    login?: string,     // 以下两个是是否以登录姿态
    api_key?: string,
    random?: boolean,    // 是否开启随机默认不开启 
    page?: string | number, // id 查询或其他
}

// type Rating = 'general' | 'sensitive' | 'questionable' | 'explicit';



type Rating = 'g' | 's' | 'q' | 'e';
