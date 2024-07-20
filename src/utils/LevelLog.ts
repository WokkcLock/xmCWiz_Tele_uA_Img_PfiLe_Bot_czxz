import chalk from 'chalk';
import fs from 'fs';
enum LogLevel {
    debug = 111,
    sql,
    deploy,
    warn,
    error,
}

let minVisibeLevel = LogLevel.debug;
const fileLogStream = fs.createWriteStream("error.log", {
    flags: 'w',     //文件的打开模式
    mode: 0o666,    //文件的权限设置
    encoding: "utf8",   //写入文件的字符的编码
    highWaterMark: 3,   //最高水位线
    start: 0, //写入文件的起始索引位置        
    autoClose: true//是否自动关闭文档
});

const fileErrorLoger = new console.Console(fileLogStream);


function levelLog(level: LogLevel = LogLevel.debug, ...args: any[]) {
    if (level < minVisibeLevel) {
        return;
    }
    switch (level) {
        case LogLevel.debug:
            process.stdout.write(`[${chalk.cyan('DEBUG')}] `);
            console.log(...args);
            break;
        case LogLevel.sql:
            process.stdout.write(`[${chalk.cyanBright('SQL')}] `);
            console.log(...args);
            break;
        case LogLevel.deploy:
            process.stdout.write(`[${chalk.greenBright('DEPLOY')}] `);
            console.log(...args);
            break;
        case LogLevel.warn:
            process.stdout.write(`[${chalk.yellowBright('WARN')}] `);
            console.log(...args);
            break;
        default:
            // error 类型log
            process.stdout.write(`[${chalk.redBright('ERROR')}] `);
            console.error(...args);
            break;
    }
}

function setLogLevel(newLogLevel: LogLevel) {
    minVisibeLevel = newLogLevel
}


function generateSingleLevelLog(level: LogLevel) {
    return (...args: any[]) => {
        levelLog(level, ...args);
    }
}

export { levelLog, LogLevel, setLogLevel, fileErrorLoger, generateSingleLevelLog };