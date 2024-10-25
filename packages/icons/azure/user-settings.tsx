// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgUserSettings = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={6.85} x2={6.85} y1={7.226} y2={18.562} gradientUnits="userSpaceOnUse">
        <stop offset={0.225} stopColor="#32d4f5" />
        <stop offset={0.473} stopColor="#31d1f3" />
        <stop offset={0.888} stopColor="#22a5cb" />
        <stop offset={0.999} stopColor="#198ab3" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={6.563} x2={7.391} y1={1.149} y2={11.442} gradientUnits="userSpaceOnUse">
        <stop offset={0.225} stopColor="#32d4f5" />
        <stop offset={0.473} stopColor="#31d1f3" />
        <stop offset={0.888} stopColor="#22a5cb" />
        <stop offset={0.999} stopColor="#198ab3" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M17.977 9.2V7.788l-.2-.074-1.511-.5-.4-.966.768-1.634-.991-.991-.2.1-1.412.718-.966-.4-.619-1.709h-1.405l-.074.2-.5 1.511-.966.4L7.9 3.676l-.991.991.1.2.718 1.412-.4.966-1.734.619v1.41l.2.074 1.511.5.4.966-.774 1.631.99.99.2-.1 1.412-.718.966.4.619 1.709h1.412l.075-.2.495-1.511.966-.4 1.635.768.991-.991-.1-.2-.718-1.412.4-.966Zm-6.193 2.049A2.718 2.718 0 1 1 14.5 8.531a2.715 2.715 0 0 1-2.716 2.718"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M12.459 16.516a1.215 1.215 0 0 0 1.218-1.21 1 1 0 0 0-.008-.146c-.478-3.816-2.655-6.923-6.808-6.923-4.226 0-6.406 2.631-6.831 6.933a1.22 1.22 0 0 0 1.089 1.339 1 1 0 0 0 .122.007Z"
    />
    <path
      fill="#fff"
      d="M6.926 9.141a3.8 3.8 0 0 1-2.073-.61l2.052 5.361 2.038-5.325a3.8 3.8 0 0 1-2.017.574"
      opacity={0.8}
    />
    <circle cx={6.898} cy={5.313} r={3.829} fill={`url(#b-${suffix})`} />
  </svg>
)}
export default SvgUserSettings
