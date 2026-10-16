import model from './model.c4?raw'
import rfcFraud from './rfc-fraud.c4?raw'
import rfc from './rfc-payments.c4?raw'

export const ModelDiffExample = {
  currentFilename: 'rfc-payments.c4',
  files: {
    ['model.c4']: model,
    ['rfc-payments.c4']: rfc,
    ['rfc-fraud.c4']: rfcFraud,
  },
}
