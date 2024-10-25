// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgContainerRegistries = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.637} x2={8.637} y1={-1.991} y2={16.739} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={12.96}
        x2={12.96}
        y1={8.561}
        y2={6.141}
        gradientTransform="matrix(1 0 0 -1 0 20)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#333132" />
        <stop offset={1} stopColor="#5b5a5c" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="m7.43 8.178 2.589-1.573 7.255 2.731A3.66 3.66 0 0 0 16.23 7.49l-.01-.05A4.2 4.2 0 0 0 14 6.32a4.91 4.91 0 0 0-5.1-4.7 5.07 5.07 0 0 0-4.84 3.29A4.62 4.62 0 0 0 0 9.39a4.73 4.73 0 0 0 4.89 4.54h2.54Z"
    />
    <path fill="#767676" d="m10.07 7.159.01 4.28 7.91 1.68v-2.98z" />
    <path fill="#999" d="m10.07 7.159-2.14 1.3v3.98l2.15-1" />
    <path
      fill="#a3a3a3"
      d="m13.68 11.499.72.2v-2.33l-.72-.25zM12.96 8.889l-.72-.26v2.49l.72.2zM15.12 11.889l.7.19.02-2.22-.72-.24zM10.81 10.749l.72.18v-2.53l-.72-.24zM17.27 10.349l-.72-.25v2.17l.72.2z"
    />
    <path fill="#b3b3b3" d="m8.66 11.369-.36.21v-2.83l.36-.19Zm.71-3.22-.37.24v2.75l.37-.2Z" />
    <path fill={`url(#b-${suffix})`} d="m17.99 13.119-2.16.74-7.9-1.42 2.15-1z" />
    <path fill="#767676" d="m17.99 16.169-7.95 1.51.04-5.59 7.91 1.47z" />
    <path
      fill="#a3a3a3"
      d="M10.81 16.759v-3.55l.72.09v3.34zM12.96 16.399l-.72.13v-3.14l.72.11zM13.68 16.289v-2.72l.72.09v2.5zM15.83 15.909l-.71.13v-2.29l.71.11zM17.29 15.679l-.74.13v-1.88l.69.09z"
    />
    <path fill="#999" d="M7.93 16.4v-3.26l2.16-1v5.6Z" />
    <path fill="#b3b3b3" d="m8.61 16.389-.32-.16v-2.76l.32-.15Zm.77-3.45-.38.19v3.48l.37.19v-3.86Z" />
  </svg>
)}
export default SvgContainerRegistries
