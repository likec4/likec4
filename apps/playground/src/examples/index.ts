import type { title } from '../components/NotFound.css'
import { BigBankExample } from './bigbank'
import { BlankExample } from './blank'
import { TutorialExample } from './tutorial'

export * from './bigbank'
export * from './blank'

export const Examples = {
  'bigbank': {
    isCustom: false,
    title: 'Big Bank',
    ...BigBankExample
  },
  'tutorial': {
    isCustom: false,
    title: 'Getting Started tutorial',
    ...TutorialExample
  },
  'blank': {
    isCustom: false,
    title: 'Blank playground',
    ...BlankExample
  }
} satisfies Record<string, { isCustom: boolean; title: string; currentFilename: string; files: Record<string, string> }>
