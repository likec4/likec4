import { pushHistory, saveBeforeEditing } from './actions'
import { machine } from './setup'

const to = {
  idle: { target: '#idle' },
  moving: { target: '#moving' },
} as const

const idOf = (t: { target: string }) => ({ id: t.target.substring(1) })

const stopHotkey = () => machine.stopChild('hotkey')

const ensureHotKey = () =>
  machine.enqueueActions(({ check, enqueue, self }) => {
    const hasUndo = check('can undo') || check('can redo')
    const hotkey = self.getSnapshot().children['hotkey']
    if (!hasUndo && hotkey) {
      enqueue.stopChild(hotkey)
      return
    }
    if (hasUndo && !hotkey) {
      enqueue.spawnChild('hotkey', {
        id: 'hotkey',
      })
    }
  })

/**
 * Idle state, no pending operations
 */
const idle = machine.createStateConfig({
  ...idOf(to.idle),
  on: {
    'edit.move.start': {
      ...to.moving,
    },
  },
})

const clearEditing = () =>
  machine.assign({
    editing: null,
  })

const moving = machine.createStateConfig({
  ...idOf(to.moving),
  entry: [
    saveBeforeEditing(),
    stopHotkey(),
  ],
  exit: [
    ensureHotKey(),
  ],
  on: {
    'edit.move.end': {
      actions: pushHistory(),
      ...to.idle,
    },
    'edit.move.cancel': {
      actions: clearEditing(),
      ...to.idle,
    },
    'cancel': {
      actions: clearEditing(),
      ...to.idle,
    },
  },
})

export const editor = machine.createStateConfig({
  initial: 'idle',
  states: {
    idle,
    moving,
  },
  on: {
    '*': {
      actions: ensureHotKey(),
    },
  },
})
