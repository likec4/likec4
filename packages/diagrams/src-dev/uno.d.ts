import type { AttributifyNames } from '@unocss/preset-attributify'

type Prefix = 'uno:' // change it to your prefix

declare module 'react' {
  interface HTMLAttributes extends Partial<Record<AttributifyNames<Prefix>, string>> {}
}
