import { createBrowserInspector } from '@statelyai/inspect'

export const inspector = {
  inspect: import.meta.env.DEV ? createBrowserInspector().inspect : () => {},
}
