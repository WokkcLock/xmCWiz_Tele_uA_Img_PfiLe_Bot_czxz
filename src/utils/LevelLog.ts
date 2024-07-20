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
let fileLogStream = fs.createWriteStream("error.log", {
    flags: 'w',     //文件的打开模式
    mode: 0o666,    //文件的权限设置
    encoding: "utf8",   //写入文件的字符的编码
    highWaterMark: 3,   //最高水位线
    start: 0, //写入文件的起始索引位置        
    autoClose: true//是否自动关闭文档
});


function levelLog(level: LogLevel = LogLevel.debug, ...args: any[]) {
    if (level < minVisibeLevel) {
        return;
    }
    let logStr: string;
    switch (level) {
        case LogLevel.debug:
            logStr = `[${chalk.cyan('DEBUG')}] `;
            // process.stdout.write(`[${chalk.cyan('DEBUG')}] `);
            break;
        case LogLevel.sql:
            logStr = `[${chalk.cyanBright('SQL')}] `;
            // process.stdout.write(`[${chalk.cyanBright('SQL')}] `);
            break;
        case LogLevel.deploy:
            logStr = `[${chalk.greenBright('DEPLOY')}] `;
            // process.stdout.write(`[${chalk.greenBright('DEPLOY')}] `);
            break;
        case LogLevel.warn:
            logStr = `[${chalk.yellowBright('WARN')}] `;
            // process.stdout.write(`[${chalk.yellowBright('WARN')}] `);
            break;
        default:
            // error 类型log
            logStr = `[${chalk.redBright('ERROR')}] `;
            // process.stdout.write(`[${chalk.redBright('ERROR')}] `);
            break;
    }
    process.stdout.write(logStr!);
    console.log(...args);
}

function setLogLevel(newLogLevel: LogLevel) {
    minVisibeLevel = newLogLevel
}


function generateSingleLevelLog(level: LogLevel) {
    return (...args: any[]) => {
        levelLog(level, ...args);
    }
}

export { levelLog, LogLevel, setLogLevel, fileLogStream, generateSingleLevelLog };