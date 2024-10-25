// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgConditionalAccess = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={16.79} y2={1.21} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.06} stopColor="#0a7cd7" />
        <stop offset={0.34} stopColor="#2e8ce1" />
        <stop offset={0.59} stopColor="#4897e9" />
        <stop offset={0.82} stopColor="#589eed" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M16.08 8.44c0 4.57-5.62 8.25-6.85 9a.43.43 0 0 1-.46 0c-1.23-.74-6.85-4.42-6.85-9v-5.5a.44.44 0 0 1 .43-.44C6.73 2.39 5.72.5 9 .5s2.27 1.89 6.65 2a.44.44 0 0 1 .43.44Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M15.5 8.48c0 4.2-5.16 7.57-6.29 8.25a.4.4 0 0 1-.42 0c-1.13-.68-6.29-4.05-6.29-8.25v-5A.41.41 0 0 1 2.9 3C6.92 2.93 6 1.21 9 1.21S11.08 2.93 15.1 3a.41.41 0 0 1 .4.4Z"
    />
    <path
      fill="#ffbd02"
      d="M11.85 7.66h-.4V6.24a2.62 2.62 0 0 0-.7-1.81 2.37 2.37 0 0 0-3.48 0 2.6 2.6 0 0 0-.7 1.81v1.42h-.4a.32.32 0 0 0-.35.34v3.68a.32.32 0 0 0 .33.32h5.7a.32.32 0 0 0 .33-.32V8a.32.32 0 0 0-.33-.34m-1.55 0H7.7V6.22a1.43 1.43 0 0 1 .41-1 1.19 1.19 0 0 1 1.78 0 1.6 1.6 0 0 1 .16.2 1.4 1.4 0 0 1 .25.79Z"
    />
    <path fill="#ffe452" d="M6.15 7.66h5.7a.32.32 0 0 1 .21.08L5.94 11.9a.33.33 0 0 1-.12-.24V8a.32.32 0 0 1 .33-.34" />
    <path
      fill="#ffd400"
      d="M11.85 7.66h-5.7a.32.32 0 0 0-.21.08l6.12 4.16a.3.3 0 0 0 .12-.24V8a.32.32 0 0 0-.33-.34"
      opacity={0.5}
    />
  </svg>
)}
export default SvgConditionalAccess
