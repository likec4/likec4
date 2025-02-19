import bigbank from './bigbank.c4?raw'
import _spec from './specs.c4?raw'

export const BigBankExample = {
  currentFilename: 'bigbank.c4',
  files: {
    ['specs.c4']: _spec,
    ['bigbank.c4']: bigbank,
  },
}
