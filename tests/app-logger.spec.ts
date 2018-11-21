import { expect } from 'chai';
import 'mocha';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as rimraf from 'rimraf';

import { AppLogger, LogLevel } from '../src';

const folderRoot = path.join(__dirname, '..');
const logsFolder = path.join(folderRoot, 'logs')

process.setMaxListeners(12);

describe('AppLogger Initialization', () => {
  before(() => {
    cleanLogsSync(logsFolder);
  });

  after(() => {
    cleanLogsSync(logsFolder);
  });

  it('should be an empty object before calling init()', () => {
    let result = AppLogger.Log;
    expect(result).to.be.empty;
  });

  it('should be initialized after calling init()', () => {
    AppLogger.Log.init({
      console: {
        level: LogLevel.SILLY
      }
    });
    let result = AppLogger.Log;
    expect(result).to.not.be.empty;
  });

  it('should not create a logs folder at specified path if "files" property is not specified in init()', () => {
    AppLogger.Log.init({
      console: {
        level: LogLevel.SILLY
      }
    });

    let isFolderExists = fs.existsSync(logsFolder);
    expect(isFolderExists).to.be.false;
  });

  it('should create a logs folder at specified path if "file" property is specified in init()', () => {
    AppLogger.Log.init({
      console: {
        level: LogLevel.SILLY
      },
      file: {
        path: folderRoot,
        level: LogLevel.SILLY,
        logAsJson: true,
        maxFileCount: 5
      }
    });

    let isFolderExists = fs.existsSync(logsFolder);
    expect(isFolderExists).to.be.true;
  });

  it('should create a file with the correct file name pattern', async () => {
    initLogger(true, LogLevel.SILLY);

    await writeLogWithTimeout(LogLevel.INFO, 0.5);

    let today = new Date();
    let datePattern = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let filePath = path.join(logsFolder, 'server-log-' + datePattern + '.log');
    let isFileExists = fs.existsSync(filePath);
    expect(isFileExists).to.be.true
  });
});

describe('AppLogger Functionalities', () => {
  beforeEach(() => {
    cleanLogsSync(logsFolder);
  });

  afterEach(() => {
    cleanLogsSync(logsFolder);
  });

  it('should log every entry above the specified log level', async () => {

    initLogger(true, LogLevel.DEBUG);

    let today = new Date();
    let datePattern = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let filePath = path.join(logsFolder, 'server-log-' + datePattern + '.log');

    await writeLogWithTimeout(LogLevel.INFO, 0.5);
    let fileContents = fs.readFileSync(filePath);
    let isInfoValid = false;
    if (String(fileContents).trim() != '') {
      isInfoValid = true;
    }

    cleanLogsSync(logsFolder);

    initLogger(true, LogLevel.DEBUG);
    await writeLogWithTimeout(LogLevel.SILLY, 0.5);

    let isSillyValid = false;
    if (fs.existsSync(filePath)) {
      fileContents = fs.readFileSync(filePath);
      if (String(fileContents).trim() != '') {
        isSillyValid = true;
      }
    }

    let result: boolean = false;
    if (isInfoValid && !isSillyValid) {
      result = true;
    }

    expect(result).to.be.true;
  });

  it('should log the log metadata in fullness', async () => {
    initLogger(true, LogLevel.SILLY);

    let today = new Date();
    let datePattern = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let filePath = path.join(logsFolder, 'server-log-' + datePattern + '.log');

    await writeLogWithTimeout(LogLevel.INFO, 0.5);
    let isInfoValid = false;
    let fObj = JSON.parse(String(fs.readFileSync(filePath)));
    if (fObj.level == 'info' && fObj.message == 'Test message') {
      isInfoValid = true;
    }

    cleanLogsSync(logsFolder);

    initLogger(true, LogLevel.SILLY);
    await writeLogWithTimeout(LogLevel.SILLY, 0.5);

    let isSillyValid = false;
    fObj = JSON.parse(String(fs.readFileSync(filePath)));
    if (fObj.level == 'silly' && fObj.message == 'Test message') {
      isSillyValid = true;
    }

    let result: boolean = false;
    if (isInfoValid && isSillyValid) {
      result = true;
    }

    expect(result).to.be.true;
  });

  it('should log contents as JSON if "logAsJson" is set to "true"', async () => {
    initLogger(true, LogLevel.SILLY);

    let today = new Date();
    let datePattern = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let filePath = path.join(logsFolder, 'server-log-' + datePattern + '.log');

    await writeLogWithTimeout(LogLevel.INFO, 0.5);
    let result = false;
    try {
      let fileContents = String(fs.readFileSync(filePath));
      let fObj = JSON.parse(fileContents);
      result = true;
    } catch (error) {
      result = false;
    }

    expect(result).to.be.true;
  });

  it('should log contents as plain text if "logAsJson" is set to "false"', async () => {
    initLogger(false, LogLevel.SILLY);

    let today = new Date();
    let datePattern = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let filePath = path.join(logsFolder, 'server-log-' + datePattern + '.log');

    await writeLogWithTimeout(LogLevel.INFO, 0.5);
    let result = false;
    try {
      let fileContents = String(fs.readFileSync(filePath));
      let fObj = JSON.parse(fileContents);
      result = false;
    } catch (error) {
      result = true;
    }

    expect(result).to.be.true;
  });
});

function initLogger(logAsJson: boolean, logLevel: LogLevel): void {
  AppLogger.Log.init({
    file: {
      path: folderRoot,
      level: logLevel,
      logAsJson: logAsJson,
      maxFileCount: 5
    }
  });
}

function writeLogWithTimeout(level: LogLevel, timeoutSeconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      let func;
      switch (level) {
        case LogLevel.ERROR:
          AppLogger.Log.error('Test message', { msg: 'test', type: 'error' });
          break;
        case LogLevel.WARNING:
          AppLogger.Log.warn('Test message', { msg: 'test', type: 'warn' });
          break;
        case LogLevel.INFO:
          AppLogger.Log.info('Test message', { msg: 'test', type: 'info' });
          break;
        case LogLevel.VERBOSE:
          AppLogger.Log.verbose('Test message', { msg: 'test', type: 'verbose' });
          break;
        case LogLevel.DEBUG:
          AppLogger.Log.debug('Test message', { msg: 'test', type: 'debug' });
          break;
        case LogLevel.SILLY:
          AppLogger.Log.silly('Test message', { msg: 'test', type: 'silly' });
          break;
        default:
          throw new Error('Invalid log level.');
      }
    } catch (error) {
      reject();
    }
    setTimeout(() => {
      resolve();
    }, timeoutSeconds * 1000);
  });
}

function cleanLogsSync(logsPath): void {
  logsPath = path.join(logsPath, '**');
  rimraf.sync(logsPath);
}
