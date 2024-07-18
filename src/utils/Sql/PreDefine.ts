const tableName = 
{
    kind: "kinds",
    tag: "tags",
    cache: {
        g: "general_cache",
        s: "sensitive_cache",
        q: "questionable_cache",
        e: "explicit_cache",
        n: "disable_cache"
    },    
}


const kindStrLenLimit = 50;
const tagstrLenLimit = 50;


export { tableName,
    kindStrLenLimit, tagstrLenLimit };


