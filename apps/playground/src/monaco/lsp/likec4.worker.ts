import { setLogLevel, startLanguageServer } from '@likec4/language-server/browser'
import { LogLevels, rootLogger as root } from '@likec4/log'

root.wrapConsole()
root.level = LogLevels.debug
setLogLevel('debug')
startLanguageServer()
