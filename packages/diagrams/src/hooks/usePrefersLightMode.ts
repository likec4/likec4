import { useMediaQuery } from '@react-hookz/web/esm'

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: light)'

export function usePrefersLightMode() {
  return useMediaQuery(COLOR_SCHEME_QUERY)
}
