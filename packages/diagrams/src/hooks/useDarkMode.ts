import { useMediaQuery } from '@react-hookz/web/esm'

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'

export function useDarkMode() {
  return useMediaQuery(COLOR_SCHEME_QUERY) ?? true
}
