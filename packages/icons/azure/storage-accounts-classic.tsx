// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgStorageAccountsClassic = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={15.83} y2={5.79} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.18} stopColor="#32caea" />
        <stop offset={0.41} stopColor="#32d2f2" />
        <stop offset={0.78} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill={`url(#a-${suffix})`} d="M.5 5.79h17v9.48a.57.57 0 0 1-.57.57H1.07a.57.57 0 0 1-.57-.57z" />
    <path fill="#198ab3" d="M1.07 2.17h15.86a.57.57 0 0 1 .57.57v3.05H.5V2.73a.57.57 0 0 1 .57-.56" />
    <path
      fill="#fff"
      d="M2.81 6.89h12.37a.27.27 0 0 1 .26.27v1.4a.27.27 0 0 1-.26.27H2.81a.27.27 0 0 1-.26-.27v-1.4a.27.27 0 0 1 .26-.27"
    />
    <path
      fill="#9cebff"
      d="M2.82 9.68h12.37a.27.27 0 0 1 .26.27v1.41a.27.27 0 0 1-.26.27H2.82a.27.27 0 0 1-.26-.27V10a.27.27 0 0 1 .26-.32"
    />
    <path
      fill="#50e6ff"
      d="M2.82 12.5h12.37a.27.27 0 0 1 .26.27v1.41a.27.27 0 0 1-.26.27H2.82a.27.27 0 0 1-.26-.27v-1.41a.27.27 0 0 1 .26-.27"
    />
  </svg>
)}
export default SvgStorageAccountsClassic
