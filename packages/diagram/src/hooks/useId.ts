import { useId as useMantineId } from '@mantine/hooks'

export function useId() {
  return useMantineId().replace('mantine-', 'likec4-')
}
