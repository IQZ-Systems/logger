import { LogLevel } from './log-level.enum';

export interface ILoggerParams {
  console?: {
    level: LogLevel
  }
  file?: {
    path: string,
    level: LogLevel,
    logAsJson: boolean,
    maxFileCount: number
  }
}
