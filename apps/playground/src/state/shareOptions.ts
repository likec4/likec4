export type ShareOptions = {
  expires: ShareOptions.ExpiresValue
  forkable: boolean
  access: Exclude<ShareOptions.AccessValue, 'pincode'>
} | {
  expires: ShareOptions.ExpiresValue
  forkable: boolean
  access: 'pincode'
  pincode: string
}

export namespace ShareOptions {
  export const ExpiresValues = [
    { value: 'D1', label: '1 day' },
    { value: 'D7', label: '7 days' },
    { value: 'M1', label: '1 month' },
    { value: 'M3', label: '3 months' },
  ] as const
  export type ExpiresValue = typeof ExpiresValues[number]['value']

  export const isValidExpires = (c: unknown): c is ExpiresValue => ExpiresValues.some(opt => opt.value === c)

  export const AccessValues = [
    { value: 'any', label: 'Anyone with the link' },
    { value: 'pincode', label: 'With pincode' },
    { value: 'github:team', label: 'Github Team' },
    { value: 'github:org', label: 'Github Organization' },
  ] as const
  export type AccessValue = typeof AccessValues[number]['value']
  export const isValidAccess = (c: unknown): c is AccessValue => AccessValues.some(opt => opt.value === c)
}
