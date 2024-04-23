import chalk from 'chalk';
enum LogLevel {
    debug = 111,
    sql,
    deploy,
    warn,
    error,
    ignore,
}

const defaultLogLevel = LogLevel.debug;
let nowLogLevel = defaultLogLevel;
function levelLog(level: LogLevel = LogLevel.debug, ...args: any[]) {
    if (level >= nowLogLevel) {
        switch (level) {
            case LogLevel.debug:
                process.stdout.write(`[${chalk.cyan('DEBUG')}] `);
                break;
            case LogLevel.sql:
                process.stdout.write(`[${chalk.cyanBright('SQL')}] `);
                break;
            case LogLevel.deploy:
                process.stdout.write(`[${chalk.greenBright('DEPLOY')}] `);
                break;
            case LogLevel.warn:
                process.stdout.write(`[${chalk.yellowBright('WARN')}] `);
                break;
            case LogLevel.error:
                process.stdout.write(`[${chalk.redBright('ERROR')}] `);
                break;
            default:
                throw new Error(`use error input in levelLog Func`);
        }
        console.log(...args);
    }
}

function setLoglevel(newLevel: LogLevel) {
    nowLogLevel = newLevel;
}

function generateSingleLevelLog(level: LogLevel) {
    return (...args: any[]) => {
        levelLog(level, ...args);
    }
}

export { levelLog, LogLevel, setLoglevel, generateSingleLevelLog };