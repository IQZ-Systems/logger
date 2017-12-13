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

export class AppLogger {

  private static _instance: AppLogger;

  private _logger: LoggerInstance;

  /**
   * Highest priority log level. Priority: 0
   * @method error
   * @param  {string} message The message to be logged.
   * @param  {object} meta    Additional metadata as an object.
   */
  error(message: string, meta: object): void {
    this._logger.error(message, meta);
  }

  /**
   * Second highest priority log level. Priority: 1
   * @method warn
   * @return {LeveledLogMethod}    Method to log warnings.
   */
  warn: LeveledLogMethod;

  /**
   * Normal informational log level. Priority: 2
   * @method info
   * @return {LeveledLogMethod}    Method to log informational messages.
   */
  info: LeveledLogMethod;

  /**
   * Verbose (more detailed) informational log level. Priority: 3
   * @method verbose
   * @return {LeveledLogMethod}    Method to log detailed informational messages.
   */
  verbose: LeveledLogMethod;

  /**
   * Debug log level. Priority: 4
   * @method debug
   * @return {LeveledLogMethod}    Method to log debug information.
   */
  debug: LeveledLogMethod;

  /**
   * Lowest priority log level. Priority: 5
   * @method silly
   * @return {LeveledLogMethod}    Method to log least priority information.
   */
  silly: LeveledLogMethod;

  /**
   * Write stream accepting morgan input.
   * @method constructor
   * @return {StreamOptions}    An object with morgan stream properties.
   */
  morganWriteStream: StreamOptions;

  private constructor() {
    try {
      this._logger = new Logger({
        transports: this._getTransports(),
        exitOnError: false
      });

      this._mapMethods();
      this._initializeStreams();
    } catch (error) {
      console.error('Error initializing AppLogger.', error);
      console.error('Quitting app...');
      process.exit(2);
    }
  }

  private _mapMethods(): void {
    this.error = this._logger.error;
    this.warn = this._logger.warn;
    this.info = this._logger.info;
    this.verbose = this._logger.verbose;
    this.debug = this._logger.debug;
    this.silly = this._logger.silly;
  }

  private _initializeStreams(): void {
    this.morganWriteStream = {
      write: (message) => {
        this.info(message);
      }
    };
  }

  private _getTransports(): TransportInstance[] {
    let consoleTransportOpt: ConsoleTransportOptions = {
      colorize: true,
      level: process.env.NODE_ENV == 'development' ? 'debug' : 'info',
      handleExceptions: true,
      humanReadableUnhandledException: true,
      json: false
    };

    // Check if log folder exists. If not, create it.
    // Winston logger will fail otherwise.
    let logFolderPath: string = path.join(process.env.WORK_DIR as string, 'logs');
    if (!fs.existsSync(logFolderPath)) {
      fs.mkdirSync(logFolderPath);
    }
    console.log('Created logs folder at :', logFolderPath);

    let dailyFileRotateTransportOpt: DailyRotateFileTransportOptions = {
      filename: path.join(process.env.WORK_DIR as string, 'logs', 'server-log'),
      datePattern: 'yyyy-MM-dd.log',
      level: process.env.NODE_ENV == 'development' ? 'debug' : 'info',
      handleExceptions: true,
      humanReadableUnhandledException: true,
      json: true,
      maxFiles: 30
    };

    return [
      new transports.Console(consoleTransportOpt),
      new transports.DailyRotateFile(dailyFileRotateTransportOpt)
    ];
  }

  /**
   * Gets an instance of the AppLogger, either the existing or creating a new one if not exist.
   * @method Log
   * @return {AppLogger} The AppLogger instance.
   */
  public static get Log(): AppLogger {
    return AppLogger._instance || (AppLogger._instance = new AppLogger());
  }
}
