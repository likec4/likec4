// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCommit = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={9.387} y2={0.486} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={0.229} stopColor="#8952e5" />
        <stop offset={0.55} stopColor="#9e6ff0" />
        <stop offset={0.735} stopColor="#a67af4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9} x2={9} y1={17.514} y2={11.713} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={0.735} stopColor="#a67af4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M5.1 4.213 8.7.612a.43.43 0 0 1 .608 0l3.6 3.6a.192.192 0 0 1-.135.328h-2.218a.19.19 0 0 0-.192.191v4.5a.154.154 0 0 1-.153.153H7.79a.154.154 0 0 1-.153-.153v-4.5a.19.19 0 0 0-.192-.191H5.23a.192.192 0 0 1-.13-.327"
    />
    <rect width={18} height={5.801} y={11.713} fill={`url(#b-${suffix})`} rx={0.581} />
    <rect width={3.012} height={3.012} x={2.995} y={13.182} fill="#fff" rx={0.245} />
    <rect width={3.012} height={3.012} x={7.494} y={13.182} fill="#b4ec36" rx={0.245} />
    <rect width={3.012} height={3.012} x={11.993} y={13.182} fill="#b4ec36" rx={0.245} />
  </svg>
)}
export default SvgCommit
