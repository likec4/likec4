// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureApiForFhir = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.09} x2={9.09} y1={17.5} y2={1.36} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#ef7100" />
        <stop offset={0.13} stopColor="#f27d07" />
        <stop offset={0.43} stopColor="#f69113" />
        <stop offset={0.72} stopColor="#f99e1b" />
        <stop offset={1} stopColor="#faa21d" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M13.47 1.38a4.26 4.26 0 0 0-4.38 2.85A4.28 4.28 0 0 0 4.7 1.38C.75 1.69.54 5.6.6 7.1.63 8.17.84 11.54 9 17.4v.1l.07-.05.07.05v-.1c8.2-5.86 8.41-9.29 8.44-10.4.06-1.46-.16-5.31-4.11-5.62"
    />
    <g fill="#ffe452">
      <path d="M17 3.8a6.37 6.37 0 0 1-.31 4c-.88 2-2.8 3.6-5.59 4.78a1.34 1.34 0 0 0-1-.43 1.37 1.37 0 1 0 1.36 1.41A13.7 13.7 0 0 0 17 9.34a6.2 6.2 0 0 0 .54-3.26A7 7 0 0 0 17 3.8M6.87 11.94l-.39.4C3.73 9.63 2.86 7.48 4 6.36s3.27-.25 6 2.47l-.39.4a.52.52 0 0 0 0 .74.51.51 0 0 0 .74 0l.74-.74a.53.53 0 0 0 0-.74l-.37-.37c-1.85-1.86-5-4.11-7-2.78a3.24 3.24 0 0 1-1-2 2.28 2.28 0 0 1 .46-1.63A4 4 0 0 0 1.7 2.84 3.52 3.52 0 0 0 3 6.08c-1.3 2 .94 5.14 2.79 7l.37.38a.53.53 0 0 0 .74 0l.75-.75a.53.53 0 0 0 0-.74.52.52 0 0 0-.78-.03" />
    </g>
  </svg>
)}
export default SvgAzureApiForFhir
