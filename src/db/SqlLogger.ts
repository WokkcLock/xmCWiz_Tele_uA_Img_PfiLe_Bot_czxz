import { LogWriter } from 'drizzle-orm/logger';
import { levelLog, LogLevel } from '../utils/LevelLog.js';
class SqlLogger implements LogWriter {
    write(message: string): void {
        levelLog(LogLevel.sql, message);
    }
}

export default SqlLogger;