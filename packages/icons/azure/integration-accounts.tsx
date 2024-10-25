// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIntegrationAccounts = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={5.06} x2={5.06} y1={11.62} y2={14.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={13.06} x2={13.06} y1={11.62} y2={14.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M1.06 1.6v14.92a.54.54 0 0 0 .54.54h14.92a.54.54 0 0 0 .54-.54V1.6a.54.54 0 0 0-.54-.54H1.6a.54.54 0 0 0-.54.54m14.56 14H3a.54.54 0 0 1-.54-.54V2.5h13.16Z"
    />
    <path fill="#ffca00" d="M3.62 3.62H6.5V6.5H3.62Z" />
    <path fill="#e62323" d="M3.62 7.62H6.5v2.88H3.62Z" />
    <path fill="#5ea0ef" d="M7.62 7.62h2.88v2.88H7.62Z" />
    <path fill={`url(#a-${suffix})`} d="M3.62 11.62H6.5v2.88H3.62Z" />
    <path fill="#e62323" d="M7.62 11.62h2.88v2.88H7.62Z" />
    <path fill={`url(#b-${suffix})`} d="M11.62 11.62h2.88v2.88h-2.88Z" />
  </svg>
)}
export default SvgIntegrationAccounts
