// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDatabaseMigrationService = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="m4.69 7.7 4.69-2.71V2.27L2.25 6.38l.39.48 1.62.88z" fill="#4285f4" />
    <path
      d="m9.38 17.36-7.13-4.11v-2.59l7.13 4.12Zm0 1.77L2.25 15v2.6l7.13 4.12Zm0-8.71L4.69 7.7 2.25 6.38v2.5L9.38 13"
      fill="#aecbfa"
      fillRule="evenodd"
    />
    <path
      d="m9.38 21.73 7-4V15.1l-7 4m0-4.35 7-4h2.08v2.33h-1.68l-7.4 4.29Zm0-1.77 7.41-4.28h2.44v1.36l2.51-2.51-2.51-2.5v1.32h-2.87l-1.23.72-1.06.61-2.72 1.57-2 1.15ZM9.38 4.99l3.16 1.83 2.36-1.36-5.52-3.19z"
      fill="#669df6"
      fillRule="evenodd"
    />
  </svg>
)}
export default SvgDatabaseMigrationService
