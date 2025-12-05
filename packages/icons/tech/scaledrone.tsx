// @ts-nocheck

import type { SVGProps } from 'react'
const SvgScaledrone = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 256" {...props}>
    <defs>
      <linearGradient id="scaledrone_svg__a" x1="75.094%" x2="26.264%" y1="93.381%" y2="8.971%">
        <stop offset="0%" stopColor="#FFF" stopOpacity={0} />
        <stop offset="47.52%" stopColor="#6466BB" />
        <stop offset="100%" stopColor="#FFF" stopOpacity={0} />
      </linearGradient>
    </defs>
    <circle cx={128} cy={128} r={128} fill="url(#scaledrone_svg__a)" opacity={0.5} />
    <path
      fill="#6466BB"
      d="M205.6 83.2 238.9 64c-30-52-96.6-69.9-148.6-39.8-52 30-69.9 96.6-39.8 148.6L17.1 192c30 52 96.6 69.9 148.6 39.8 52.1-30 69.9-96.6 39.9-148.6"
    />
  </svg>
)
export default SvgScaledrone
