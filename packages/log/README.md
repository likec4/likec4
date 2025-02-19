# `@likec4/log`

Shared interface for logging.

## Usage

```ts
import { createLogger, loggable, rootLogger } from '@likec4/log'

const logger = createLogger('module')
// OR
const logger = rootLogger.getChild('module')
```

## Prefer template strings

```ts
const name = 'world'
logger.info`Hello, ${name}!`
```

## Logging errors

When logging errors, you can use `loggable`:

```ts
import { loggable } from '@likec4/log'

try {
  throw new Error('Something went wrong')
} catch (error) {
  logger.error(loggable(error))
  // OR pass as second argument
  logger.error('An error occurred', { error })
}
```
