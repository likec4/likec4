import { enqueueActions, log } from 'xstate'
import { assignViewportBefore, cancelFitDiagram, returnViewportBefore, setViewport } from './machine.actions'
import { machine, targetState, to } from './machine.setup'
import { viewBounds } from './utils'

/**
 * State when the diagram is being prepared for printing.
 * Adjusts the viewport to fit the entire diagram for optimal printing.
 * Restores the previous viewport upon exiting the state.
 */
export const printing = machine.createStateConfig({
  id: targetState.printing.slice(1),
  entry: [
    cancelFitDiagram(),
    assignViewportBefore(),
    enqueueActions(({ enqueue, context }) => {
      const bounds = viewBounds(context)
      const OFFSET = 16
      enqueue(
        setViewport({
          viewport: {
            x: bounds.x + OFFSET,
            y: bounds.y + OFFSET,
            zoom: 1,
          },
          duration: 0,
        }),
      )
    }),
  ],
  exit: [
    returnViewportBefore({ delay: 0, duration: 0 }),
  ],
  on: {
    'media.print.off': {
      ...to.idle,
    },
    '*': {
      actions: [
        log(({ event }) => `Printing state - ignoring event: ${event.type}`),
      ],
    },
  },
})
