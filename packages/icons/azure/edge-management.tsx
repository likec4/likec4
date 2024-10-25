// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEdgeManagement = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.9} x2={8.9} y1={1.31} y2={12.11} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={0.18} stopColor="#559cec" />
        <stop offset={0.47} stopColor="#3c91e5" />
        <stop offset={0.84} stopColor="#1380da" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={8.88} x2={8.88} y1={16.72} y2={13.85} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.16} stopColor="#1380da" />
        <stop offset={0.53} stopColor="#3c91e5" />
        <stop offset={0.82} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <g data-name="Layer 1">
      <path
        fill={`url(#a-${suffix})`}
        d="M16.4 8.7a3.39 3.39 0 0 0-2.92-3.29A4.27 4.27 0 0 0 9.1 1.28a4.37 4.37 0 0 0-4.16 2.88A4.08 4.08 0 0 0 1.4 8.09a4.12 4.12 0 0 0 4.23 4h7.21L13 12a3.44 3.44 0 0 0 3.4-3.3"
      />
      <path
        fill="#949494"
        d="M13.21 12.7h-4v-5h-.6v5h-4a.3.3 0 0 0-.3.3v1.17a.3.3 0 0 0 .3.3.29.29 0 0 0 .29-.3v-.88h3.71v.61h.59v-.61h3.72v1.09a.3.3 0 0 0 .29.3.31.31 0 0 0 .3-.3V13a.3.3 0 0 0-.3-.3"
      />
      <path
        fill={`url(#b-${suffix})`}
        d="M14.23 16.72h-2.08a.36.36 0 0 1-.37-.37v-2.13a.37.37 0 0 1 .37-.37h2.08a.38.38 0 0 1 .37.37v2.13a.37.37 0 0 1-.37.37m-3.94-.37v-2.13a.38.38 0 0 0-.37-.37H7.84a.37.37 0 0 0-.37.37v2.13a.36.36 0 0 0 .37.37h2.08a.37.37 0 0 0 .37-.37m-4.29 0v-2.13a.38.38 0 0 0-.37-.37H3.52a.38.38 0 0 0-.37.37v2.13a.37.37 0 0 0 .37.37h2.09a.37.37 0 0 0 .39-.37"
      />
      <path
        fill="#fff"
        d="M12 6.6v-.69h-.1l-.74-.24-.19-.47.37-.8-.48-.48-.1.05-.76.31-.48-.19-.3-.84h-.65v.1l-.24.74-.47.19L7 3.9l-.48.49.05.09.43.69-.2.47-.88.36v.68h.09l.74.24.19.47-.37.8.48.48h.1l.69-.35.47.19.3.83h.69v-.09l.24-.74.47-.19.8.37.48-.48-.05-.1-.35-.69.19-.47Zm-3 1a1.33 1.33 0 1 1 1.32-1.33A1.32 1.32 0 0 1 8.94 7.6Z"
      />
    </g>
  </svg>
)}
export default SvgEdgeManagement
