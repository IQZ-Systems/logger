import * as path from 'path';
import * as fs from 'fs';
import {
  LoggerInstance,
  LeveledLogMethod,
  Logger,
  TransportInstance,
  ConsoleTransportOptions,
  DailyRotateFileTransportOptions,
  transports
} from 'winston';
import { StreamOptions } from 'morgan';
import 'winston-daily-rotate-file';

import { LogLevel } from './log-level.enum';
import { ILoggerParams } from './logger-params.interface';

export class AppLogger {

  private static _instance: AppLogger;

  private _logger: LoggerInstance;

  private constructor() { }

  public init(params: ILoggerParams): void {
    try {
      this._logger = new Logger({
        transports: this._getTransports(params),
        exitOnError: false
      });

      this._initializeStreams();
    } catch (error) {
      console.error('Error initializing AppLogger.', error);
      throw error;
    }
  }

  private _initializeStreams(): void {
    this.morganWriteStream = {
      write: (message) => {
        this.info(message);
      }
    };
  }

  private _getTransports(params: ILoggerParams): TransportInstance[] {
    let t: TransportInstance[] = [];

    let consoleTransportOpt: ConsoleTransportOptions = {
      colorize: true,
      level: params.console.level,
      handleExceptions: true,
      humanReadableUnhandledException: true,
      json: false
    };
    t.push(new transports.Console(consoleTransportOpt));

    if (params.file && params.file.path) {
      // Check if log folder exists. If not, create it.
      // Winston logger will fail otherwise.
      let logFolderPath: string = path.join(params.file.path, 'logs');
      if (!fs.existsSync(logFolderPath)) {
        fs.mkdirSync(logFolderPath);
      }
      console.log('Created logs folder at :', logFolderPath);

      let dailyFileRotateTransportOpt: DailyRotateFileTransportOptions = {
        filename: path.join(params.file.path, 'logs', 'server-log'),
        datePattern: 'yyyy-MM-dd.log',
        level: params.file.level,
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: params.file.logAsJson,
        maxFiles: params.file.maxFileCount
      };
      t.push(new transports.DailyRotateFile(dailyFileRotateTransportOpt));
    }

    return t;
  }

  private _log(level: LogLevel, msg: string, meta?: object | object[]): void {
    if (!this._logger) {
      throw new Error('Logger not initialized. Call AppLogger.Log.init() first. You only need to do this once in your application.');
    }
    this._logger.log(level, msg, meta);
  }

  /**
   * Highest priority log level. Priority: 0
   * @method error
   * @param  {string}             message An error message.
   * @param  {object | object[]}  meta Additional metadata as an object.
   */
  public error(message: string, meta?: object | object[]): void {
    this._log(LogLevel.ERROR, message, meta);
  }

  /**
   * Second highest priority log level. Priority: 1
   * @method warn
   * @param  {string}             message A warning.
   * @param  {object | object[]}  meta Additional metadata as an object.
   */
  public warn(message: string, meta?: object | object[]): void {
    this._log(LogLevel.WARNING, message, meta);
  }

  /**
   * Normal informational log level. Priority: 2
   * @method info
   * @param  {string}             message An informational message.
   * @param  {object | object[]}  meta Additional metadata as an object.
   */
  public info(message: string, meta?: object | object[]): void {
    this._log(LogLevel.INFO, message, meta);
  }

  /**
   * Verbose (more detailed) informational log level. Priority: 3
   * @method verbose
   * @param  {string}             message A more detailed informational message.
   * @param  {object | object[]}  meta Additional metadata as an object.
   */
  public verbose(message: string, meta?: object | object[]): void {
    this._log(LogLevel.VERBOSE, message, meta);
  }

  /**
   * Debug log level. Priority: 4
   * @method debug
   * @param  {string}             message A debug information.
   * @param  {object | object[]}  meta Additional metadata as an object.
   */
  public debug(message: string, meta?: object | object[]): void {
    this._log(LogLevel.DEBUG, message, meta);
  }

  /**
   * Lowest priority log level. Priority: 5
   * @method silly
   * @param  {string}             message A silly message.
   * @param  {object | object[]}  meta Additional metadata as an object.
   */
  public silly(message: string, meta?: object | object[]): void {
    this._log(LogLevel.SILLY, message, meta);
  }

  /**
   * Write stream accepting morgan input.
   * @method constructor
   * @return {StreamOptions}    An object with morgan stream properties.
   */
  morganWriteStream: StreamOptions;

  /**
   * Gets an instance of the AppLogger, either the existing or creating a new one if not exist.
   * @method Log
   * @return {AppLogger} The AppLogger instance.
   */
  public static get Log(): AppLogger {
    return AppLogger._instance || (AppLogger._instance = new AppLogger());
  }
}
