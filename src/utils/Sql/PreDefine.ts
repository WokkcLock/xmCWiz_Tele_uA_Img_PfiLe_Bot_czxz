const tableName = "user";

const sqls = {
    createTable: `
        CREATE TABLE IF NOT EXISTS ${tableName}
        (hash TEXT primary key, content TEXT)
    `,  // * sql语句无所谓前后的空格或者换行
}

export {sqls, tableName};


