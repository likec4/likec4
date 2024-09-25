// @ts-nocheck

import type { SVGProps } from 'react'
const SvgSignalR = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient id="a" cx={9} cy={9} r={8.5} gradientUnits="userSpaceOnUse">
        <stop offset={0.18} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
      <clipPath id="b">
        <path fill="none" d="M14.21 15.72A8.5 8.5 0 0 1 3.79 2.28l.09-.06a8.5 8.5 0 0 1 10.33 13.5" />
      </clipPath>
    </defs>
    <path fill="url(#a)" d="M14.21 15.72A8.5 8.5 0 0 1 3.79 2.28l.09-.06a8.5 8.5 0 0 1 10.33 13.5" />
    <g clipPath="url(#b)">
      <path
        fill="#f2f2f2"
        d="M4.13 7.05a.28.28 0 0 0 .2.48h6.12A1.55 1.55 0 0 1 11.6 8a1.6 1.6 0 0 1 .43.92 1.43 1.43 0 0 1-.36 1.15 1.41 1.41 0 0 1-1.12.54H8.44a.08.08 0 0 0-.09.06L7.81 12c-.12.29-.25.59-.37.89a.08.08 0 0 0 0 .09L9 14.48l2.59 2.59.46.49 2.14-1.19-.47-.37-1.43-1.44L10.74 13h-.07l.52-.07A3.84 3.84 0 0 0 14 10.65a3.85 3.85 0 0 0 0-3.08 3.9 3.9 0 0 0-.73-1.12 3.7 3.7 0 0 0-1.24-.89 4 4 0 0 0-1.66-.34h-3V4.05A.14.14 0 0 0 7.18 4Z"
      />
    </g>
  </svg>
)
export default SvgSignalR
