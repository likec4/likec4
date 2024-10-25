// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCustomerLockboxForMicrosoftAzure = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={7.86} x2={7.86} y1={17.94} y2={5.72} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={7.87} x2={7.87} y1={9.28} y2={-1.85} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M13.9 16.85a1.31 1.31 0 0 0 1.32-1.3v-.16c-.52-4.11-2.86-7.46-7.34-7.46S1 10.76.51 15.4a1.32 1.32 0 0 0 1.17 1.45z"
    />
    <path fill="#fff" d="M7.87 8.9a4.13 4.13 0 0 1-2.23-.65L7.85 14 10 8.28a4 4 0 0 1-2.13.62" />
    <circle cx={7.87} cy={4.78} r={4.13} fill={`url(#b-${suffix})`} />
    <rect width={8.42} height={4.15} x={9.08} y={13.2} fill="#50e6ff" rx={0.56} />
    <path fill="#32bedd" d="M13.29 13.2H9.64a.56.56 0 0 0-.56.56v3a.56.56 0 0 0 .56.56h3.65Z" />
    <path
      fill="#fff"
      d="m12.68 14.36-.09-.1a.15.15 0 0 0-.2 0L10.63 16l-.63-.63a.17.17 0 0 0-.21 0l-.09.1a.13.13 0 0 0 0 .2l.84.85h.05a.16.16 0 0 0 .16 0l1.95-2a.13.13 0 0 0-.02-.16"
    />
    <path
      fill="#f2f2f2"
      d="m16.51 16.22-.84-.83.83-.83a.14.14 0 0 0 0-.19l-.11-.11a.12.12 0 0 0-.19 0l-.83.83-.82-.82a.14.14 0 0 0-.21 0l-.1.09a.14.14 0 0 0 0 .19l.83.84-.82.82a.16.16 0 0 0 0 .22l.1.09a.11.11 0 0 0 .18 0l.84-.83.84.83a.14.14 0 0 0 .19 0l.11-.11a.14.14 0 0 0 0-.19"
    />
  </svg>
)}
export default SvgCustomerLockboxForMicrosoftAzure
