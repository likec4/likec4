import { useId as useMantineId } from '@mantine/hooks'

export function useId(): string {
  return useMantineId().replace('mantine-', 'likec4-')
}
