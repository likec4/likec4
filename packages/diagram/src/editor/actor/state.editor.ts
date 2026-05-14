import { assign } from 'xstate'
import { pushHistory, saveBeforeEditing, scheduleSync } from './actions'
import { machine } from './setup'

const to = {
  idle: { target: '#idle' },
  moving: { target: '#moving' },
} as const

const idOf = (t: { target: string }) => ({ id: t.target.substring(1) })

const stopHotkey = () => machine.stopChild('hotkey')

const ensureHotKey = () =>
  machine.enqueueActions(({ check, enqueue, self }) => {
    const hasUndo = check('can undo')
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

const moving = machine.createStateConfig({
  ...idOf(to.moving),
  entry: [
    saveBeforeEditing,
    stopHotkey(),
  ],
  on: {
    'edit.move.end': {
      actions: [
        pushHistory(),
        scheduleSync(),
      ],
      ...to.idle,
    },
    'edit.move.cancel': {
      actions: [
        assign({
          editing: null,
        }),
      ],
      ...to.idle,
    },
    'undo': {
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
    'cancel': {
      ...to.idle,
    },
    '*': {
      actions: ensureHotKey(),
    },
  },
})
