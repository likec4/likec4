// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgImportExportJobs = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.4} y2={0.4} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14 4.8A4.61 4.61 0 0 0 9.22.4 4.73 4.73 0 0 0 4.7 3.48 4.36 4.36 0 0 0 .87 7.67a4.43 4.43 0 0 0 4.58 4.25h2.93v2.63a.13.13 0 0 1-.13.13H6.78a.13.13 0 0 0-.09.22l2.47 2.47a.19.19 0 0 0 .26 0l2.47-2.47a.13.13 0 0 0-.09-.22h-1.48a.12.12 0 0 1-.12-.13V11.9h3.06a.6.6 0 0 0 .2 0 3.69 3.69 0 0 0 3.67-3.56A3.65 3.65 0 0 0 14 4.8"
    />
    <path
      fill="#fff"
      d="m4.87 8.18 2.47-2.46a.17.17 0 0 1 .26 0l2.47 2.46a.13.13 0 0 1-.07.22H8.51a.13.13 0 0 0-.13.13v3.37H6.57V8.53a.13.13 0 0 0-.13-.13H5a.13.13 0 0 1-.13-.22"
    />
  </svg>
)}
export default SvgImportExportJobs
