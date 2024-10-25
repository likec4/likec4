// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMicrosoftDefenderForCloud = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={16.795} y2={1.205} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={0.321} stopColor="#639d26" />
        <stop offset={0.794} stopColor="#6fb12a" />
        <stop offset={0.999} stopColor="#76bc2d" />
      </linearGradient>
    </defs>
    <path
      fill="#76bc2d"
      d="M16.083 8.438c0 4.571-5.626 8.25-6.85 9a.45.45 0 0 1-.466 0c-1.224-.747-6.85-4.426-6.85-9v-5.5a.44.44 0 0 1 .434-.438C6.728 2.386 5.72.5 9 .5s2.272 1.886 6.649 2a.44.44 0 0 1 .434.435Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M15.5 8.485c0 4.191-5.16 7.566-6.282 8.25a.41.41 0 0 1-.428 0c-1.126-.684-6.29-4.059-6.29-8.25V3.441a.4.4 0 0 1 .4-.4C6.916 2.935 5.992 1.205 9 1.205s2.084 1.73 6.1 1.837a.4.4 0 0 1 .4.4Z"
    />
    <path
      fill="#fff"
      d="M11.853 7.66h-.408V6.243a2.65 2.65 0 0 0-.7-1.809 2.36 2.36 0 0 0-3.483 0 2.6 2.6 0 0 0-.7 1.808V7.66h-.415a.33.33 0 0 0-.326.32v3.682a.33.33 0 0 0 .326.32h5.706a.33.33 0 0 0 .326-.32V7.98a.33.33 0 0 0-.326-.32m-1.549 0H7.7V6.219a1.43 1.43 0 0 1 .41-.99 1.2 1.2 0 0 1 1.788 0 1.4 1.4 0 0 1 .153.2 1.45 1.45 0 0 1 .258.791Z"
    />
    <path
      fill="#b3b3b3"
      d="M6.148 7.658h5.705a.33.33 0 0 1 .21.08L5.938 11.9a.31.31 0 0 1-.116-.241v-3.68a.33.33 0 0 1 .326-.321"
      opacity={0.15}
    />
    <path
      fill="#a3a3a3"
      d="M11.853 7.658H6.147a.33.33 0 0 0-.209.08l6.124 4.162a.31.31 0 0 0 .117-.241v-3.68a.33.33 0 0 0-.326-.321"
      opacity={0.09}
    />
  </svg>
)}
export default SvgMicrosoftDefenderForCloud
