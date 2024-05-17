import { BigBankExample } from './bigbank'
import { BlankExample } from './blank'
import { TutorialExample } from './tutorial'

export * from './bigbank'
export * from './blank'

export const Examples = {
  'bigbank': {
    isCustom: false,
    ...BigBankExample
  },
  'tutorial': {
    isCustom: false,
    ...TutorialExample
  },
  'blank': {
    isCustom: false,
    ...BlankExample
  }
} satisfies Record<string, { isCustom: boolean; currentFilename: string; files: Record<string, string> }>
