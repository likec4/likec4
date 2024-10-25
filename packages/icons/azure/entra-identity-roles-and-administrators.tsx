// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEntraIdentityRolesAndAdministrators = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={7.93} x2={7.93} y1={17.95} y2={5.62} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={1} stopColor="#b4ec36" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={7.95} x2={7.95} y1={9.21} y2={-2.02} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={1} stopColor="#b4ec36" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14 16.85a1.3 1.3 0 0 0 1.32-1.31 1 1 0 0 0 0-.16c-.52-4.15-2.88-7.53-7.4-7.53S1 10.71.51 15.39a1.34 1.34 0 0 0 1.19 1.46z"
    />
    <path fill="#fff" d="M8 8.83a4.16 4.16 0 0 1-2.26-.66L7.92 14l2.22-5.79A4.2 4.2 0 0 1 8 8.83" />
    <circle cx={7.95} cy={4.67} r={4.17} fill={`url(#b-${suffix})`} />
    <path fill="#32bedd" d="M17.49 11.13v4.24l-3.64 2.13v-4.24z" />
    <path fill="#9cebff" d="m17.49 11.13-3.64 2.13-3.64-2.13L13.85 9z" />
    <path fill="#50e6ff" d="M13.85 13.26v4.24l-3.64-2.13v-4.24z" />
    <path fill="#9cebff" d="m10.21 15.37 3.64-2.11v4.24z" />
    <path fill="#50e6ff" d="m17.49 15.37-3.64-2.11v4.24z" />
  </svg>
)}
export default SvgEntraIdentityRolesAndAdministrators
