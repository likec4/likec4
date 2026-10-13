import { isNonNullish } from 'remeda'
import { assertEvent } from 'xstate'
import { typedSystem } from '../likec4diagram/state/utils'
import { actor } from './actor.setup'

export const updateActivatedBy = () =>
  actor.assign({
    activatedBy: ({ context, event }) => {
      switch (true) {
        case event.type.includes('click'):
          return 'click'
        case event.type.includes('mouseEnter'):
          return 'hover'
        default:
          return context.activatedBy
      }
    },
  })

export const keepDropdownOpen = () =>
  actor.assign({
    activatedBy: 'click',
  })

export const updateSelectedFolder = () =>
  actor.assign(({ event }) => {
    if (event.type === 'breadcrumbs.click.root') {
      return { selectedFolder: '' } // reset to root
    }
    if (event.type === 'select.view') {
      return { selectedFolder: event.viewFolder ?? '' }
    }
    assertEvent(event, ['breadcrumbs.click.folder', 'select.folder'])
    return { selectedFolder: event.folderPath }
  })

export const resetSelectedFolder = () =>
  actor.assign({
    selectedFolder: ({ context }) => context.viewFolder,
  })

export const updateInputs = () =>
  actor.enqueueActions(({ context, event, enqueue }) => {
    assertEvent(event, 'update.inputs')
    const viewChanged = event.inputs.viewId !== context.viewId
    const viewFolder = event.inputs.viewFolder
    let selectedFolder = context.selectedFolder
    if (isNonNullish(viewFolder) && !viewFolder.startsWith(selectedFolder)) {
      selectedFolder = viewFolder
    }

    // Skip if nothing changed
    if (!viewChanged && viewFolder === context.viewFolder && selectedFolder === context.selectedFolder) {
      return
    }

    enqueue.assign({
      viewId: event.inputs.viewId,
      viewFolder: viewFolder ?? context.viewFolder,
      selectedFolder,
      // allow dropdown to close on mouse leave if view changed
      activatedBy: viewChanged ? 'hover' : context.activatedBy,
    })
  })

export const resetSearchQuery = () =>
  actor.assign({
    searchQuery: '',
  })

export const updateSearchQuery = () =>
  actor.assign(({ event }) => {
    assertEvent(event, 'searchQuery.change')
    return { searchQuery: event.value ?? '' }
  })

export const emitNavigateTo = () =>
  actor.enqueueActions(({ event, enqueue }) => {
    assertEvent(event, 'select.view')
    enqueue.sendTo(typedSystem.diagramActor, {
      type: 'navigate.to',
      viewId: event.viewId,
    })
  })
