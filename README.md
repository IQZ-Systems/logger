# IQZ Logger

A wrapper for [WinstonJS][link-winston] with lots of configuration headaches already taken care of.

## Installation

```
npm install -S @iqz/logger
```

Logger includes TypeScript type definitions within the package, so you don't have to install anything in addition to the above.

## Usage

Import the logger

```typescript
import { LogLevel, AppLogger } from '@iqz/logger';
```

Create a string to hold the path where you want your logs to be created. Logger will create a _logs_ folder underneath the path.

```typescript
import * as path from 'path';
let currentDir = path.join('/', 'home', 'rajshrimohanks', 'Documents', 'works', 'test-proj');
```

Initialize your logger. You only need to do this once in your application.

```typescript
AppLogger.Log.init({
  console: {                // Optional. Remove if you don't want logging to console.
    level: LogLevel.SILLY   // Log level from which the content should be logged to the console.
  },
  file: {                   // Optional. Remove if you don't want logging to file.
    path: currentDir,       // Directory where the 'logs' folder should be created.
    level: LogLevel.SILLY,  // Log level from which the content should be logged to the log file.
    logAsJson: true,        // Should the output be logged as JSON or plain text. true - JSON; false - plain text
    maxFileCount: 5         // Maximum number of log files to be retained. Logger creates a new file for every individual day.
  }
});
```

Log your message!

```typescript
AppLogger.Log.error("This is an error message", { msg: 'hello' });
```

[link-winston]: https://github.com/winstonjs/winston
