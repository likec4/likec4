/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Dict<string> {
      NODE_ENV?: string
    }
  }
}

export const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod'
