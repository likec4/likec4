import { createBrowserInspector } from '@statelyai/inspect'

export const inspector = {
  inspect: /* @PURE */ createBrowserInspector().inspect,
}
