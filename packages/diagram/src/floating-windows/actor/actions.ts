import { produce } from 'immer'
import { assertEvent } from 'xstate'
import { type FloatingWindowsActorContext, machine } from './setup'
import type { FloatingWindowContext } from './store'
import type { WindowId } from './types'

export function openWindow(id?: WindowId) {
  return machine.assign(({ context, event }) => {
    let windowId = id
    if (!windowId) {
      assertEvent(event, 'window.open')
      windowId = event.id
    }

    return {
      opened: context.opened.has(windowId)
        ? context.opened
        : new Set([...context.opened, windowId]),
    }
  })
}

function withoutWindow(windows: FloatingWindowsActorContext['opened'], windowId: WindowId) {
  return new Set([...windows].filter(id => id !== windowId))
}

export function closeWindow(id?: WindowId) {
  return machine.assign(({ context, event }) => {
    let windowId = id
    if (!windowId) {
      assertEvent(event, 'window.close')
      windowId = event.id
    }

    return {
      opened: context.opened.has(windowId)
        ? withoutWindow(context.opened, windowId)
        : context.opened,
    }
  })
}

export function toggleWindow(id?: WindowId) {
  return machine.assign(({ context, event }) => {
    let windowId = id
    if (!windowId) {
      assertEvent(event, 'window.toggle')
      windowId = event.id
    }
    if (context.opened.has(windowId)) {
      return {
        opened: withoutWindow(context.opened, windowId),
      }
    } else {
      return {
        opened: new Set([...context.opened, windowId]),
      }
    }
  })
}
