// @ts-nocheck

import type { SVGProps } from 'react'
const SvgDigitalTwins = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9.261} x2={6.218} y1={-0.364} y2={20.052} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id="b" x1={10.798} x2={14.441} y1={7.388} y2={19.066} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={0.997} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id="c" x1={-0.168} x2={12.572} y1={4.114} y2={10.895} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#fff" />
        <stop offset={1} stopColor="#9cebff" />
      </linearGradient>
    </defs>
    <path
      fill="url(#a)"
      d="m14.428 3.35-5.195-3a2.62 2.62 0 0 0-2.622 0l-5.195 3A2.63 2.63 0 0 0 .105 5.621v6a2.63 2.63 0 0 0 1.311 2.272l5.2 3a2.62 2.62 0 0 0 2.622 0l5.2-3a2.63 2.63 0 0 0 1.311-2.272v-6a2.63 2.63 0 0 0-1.321-2.271"
    />
    <path
      fill="url(#b)"
      d="m16.842 7.743-3.653-2.109a2.11 2.11 0 0 0-2.107 0L7.43 7.743a2.1 2.1 0 0 0-1.053 1.824v4.218a2.1 2.1 0 0 0 1.053 1.824l3.652 2.109a2.11 2.11 0 0 0 2.107 0l3.653-2.109a2.11 2.11 0 0 0 1.058-1.824V9.567a2.11 2.11 0 0 0-1.058-1.824"
    />
    <path fill="url(#c)" d="m7.578 2.963 1.052-.582 4.51 9.347-.366.4H2.835l.112-1.197h8.381z" />
    <circle cx={2.732} cy={11.585} r={1.5} fill="#fff" />
    <circle cx={12.136} cy={11.676} r={2.344} fill="#fff" />
    <circle cx={8.041} cy={2.558} r={1.5} fill="#fff" />
    {'\u200B'}
  </svg>
)
export default SvgDigitalTwins
