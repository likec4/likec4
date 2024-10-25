// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgUserSubscriptions = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={7.89} x2={7.89} y1={6.9} y2={19.35} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={7.53} x2={8.44} y1={0.22} y2={11.53} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <radialGradient
        id={`c-${suffix}`}
        cx={-19.24}
        cy={6.51}
        r={6.13}
        gradientTransform="translate(32.03 6.26)scale(.94)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.27} stopColor="#ffd70f" />
        <stop offset={1} stopColor="#fea11b" />
      </radialGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14.05 17.11a1.34 1.34 0 0 0 1.34-1.33 1 1 0 0 0 0-.16C14.86 11.42 12.47 8 7.9 8S.86 10.9.4 15.63a1.34 1.34 0 0 0 1.19 1.47h12.46Z"
    />
    <path fill="#fff" d="M7.9 9a4.1 4.1 0 0 1-2.27-.67l2.25 5.89 2.24-5.85A4.17 4.17 0 0 1 7.9 9" opacity={0.8} />
    <circle cx={7.9} cy={4.8} r={4.21} fill={`url(#b-${suffix})`} />
    <path
      fill={`url(#c-${suffix})`}
      d="M17.27 11.45a1.13 1.13 0 0 0 0-1.6l-1.94-2a1.12 1.12 0 0 0-1.6 0l-2 1.94a1.14 1.14 0 0 0 0 1.61l1.61 1.64a.3.3 0 0 1 .09.22v3a.36.36 0 0 0 .12.28l.73.75a.27.27 0 0 0 .37 0l.72-.72.42-.43a.14.14 0 0 0 0-.2l-.31-.31a.17.17 0 0 1 0-.23l.31-.31a.13.13 0 0 0 0-.2l-.3-.31a.17.17 0 0 1 0-.23l.31-.31a.14.14 0 0 0 0-.2l-.42-.43v-.11Zm-2.73-3.11a.66.66 0 0 1 .64.65.63.63 0 0 1-.65.64.65.65 0 0 1 0-1.29Z"
    />
    <path
      fill="#ff9300"
      d="M14 16.38a.14.14 0 0 0 .24-.1v-2.45a.16.16 0 0 0-.06-.13.14.14 0 0 0-.22.12v2.46a.13.13 0 0 0 .04.1"
      opacity={0.75}
    />
    <rect
      width={0.38}
      height={3.21}
      x={14.38}
      y={9.07}
      fill="#ff9300"
      opacity={0.75}
      rx={0.17}
      transform="rotate(-89.65 14.562 10.673)"
    />
    <rect
      width={0.38}
      height={3.21}
      x={14.37}
      y={9.68}
      fill="#ff9300"
      opacity={0.75}
      rx={0.17}
      transform="rotate(-89.65 14.559 11.29)"
    />
  </svg>
)}
export default SvgUserSubscriptions
