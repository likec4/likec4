import dynamic from './dynamic.c4?raw'
import spec from './spec.c4?raw'
import views from './views.c4?raw'

export const DynamicViewExample = {
  currentFilename: 'dynamic.c4',
  files: {
    ['spec.c4']: spec,
    ['dynamic.c4']: dynamic,
    ['views.c4']: views,
  },
}
