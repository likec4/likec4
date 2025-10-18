import { useCommand } from 'reactive-vscode'
import { commands } from '../meta'

export interface RestartCommandDeps {
  sendTelemetry(commandId: string): void
  restartServer(): Promise<void>
}

export function registerRestartCommand({ sendTelemetry, restartServer }: RestartCommandDeps) {
  useCommand(commands.restart, () => {
    sendTelemetry(commands.restart)
    void restartServer()
  })
}
