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
    assertEvent(event, ['breadcrumbs.click.folder', 'select.folder'])
    return { selectedFolder: event.folderPath }
  })

export const resetSelectedFolder = () =>
  actor.assign({
    selectedFolder: ({ context }) => context.viewModel?.folder.path ?? '',
  })

export const updateInputs = () =>
  actor.assign(({ context, event }) => {
    assertEvent(event, 'update.inputs')
    const viewChanged = event.inputs.viewModel?.id !== context.viewModel?.id
    let selectedFolder = context.selectedFolder
    if (!event.inputs.viewModel?.folder.path.startsWith(selectedFolder)) {
      selectedFolder = event.inputs.viewModel?.folder.path ?? ''
    }
    return {
      view: event.inputs.view,
      viewModel: event.inputs.viewModel,
      selectedFolder,
      // allow dropdown to close on mouse leave if view changed
      activatedBy: viewChanged ? 'hover' : context.activatedBy,
    }
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
