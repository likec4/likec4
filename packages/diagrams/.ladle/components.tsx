import { ModeState, type GlobalProvider } from '@ladle/react'
import { Measures, useMeasure } from '@react-hookz/web/esm'
import { createContext, useContext } from 'react'

const MeasuresContext = createContext<Measures>({} as Measures)

export const useStoryViewport = () => useContext(MeasuresContext)

export const Provider: GlobalProvider = ({ children, globalState }) => {
  // const [viewId, setViewId] = useViewId(
  const isFullScreen = globalState.mode === ModeState.Preview || globalState.width !== 0
  const [measures, measuresRef] = useMeasure<HTMLDivElement>()
  return (
    <div
      ref={measuresRef}
      style={
        isFullScreen
          ? { position: 'fixed', inset: 0 }
          : {
              width: '100%',
              minHeight: '100%',
              position: 'relative'
            }
      }
    >
      {measures && measures.width > 0 && measures.height > 0 && (
        <MeasuresContext.Provider value={measures}>{children}</MeasuresContext.Provider>
      )}
    </div>
  )
}
