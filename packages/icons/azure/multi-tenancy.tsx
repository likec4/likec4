// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMultiTenancy = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={6.234} x2={6.234} y1={5.679} y2={16.03} gradientUnits="userSpaceOnUse">
        <stop offset={0.227} stopColor="#a67af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={5.972} x2={6.727} y1={0.13} y2={9.529} gradientUnits="userSpaceOnUse">
        <stop offset={0.225} stopColor="#a67af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={9.128} x2={18} y1={13.552} y2={13.552} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#1988d9" />
        <stop offset={0.9} stopColor="#54aef0" />
      </linearGradient>
    </defs>
    <path
      fill="#773adc"
      d="M16.312 11.946a.74.74 0 0 0 .742-.738 1 1 0 0 0 0-.089C16.758 8.792 15.431 6.9 12.9 6.9c-2.577 0-3.907 1.605-4.166 4.228a.745.745 0 0 0 .664.817 1 1 0 0 0 .075 0Z"
    />
    <circle cx={12.898} cy={5.114} r={2.335} fill="#773adc" />
    <path
      fill={`url(#a-${suffix})`}
      d="M11.355 14.162a1.11 1.11 0 0 0 1.112-1.105 1 1 0 0 0-.008-.134C12.024 9.439 10.036 6.6 6.243 6.6 2.385 6.6.394 9 .006 12.933A1.115 1.115 0 0 0 1 14.156a1 1 0 0 0 .112.006Z"
    />
    <path
      fill="#fff"
      d="M6.3 7.428a3.5 3.5 0 0 1-1.89-.557l1.874 4.895L8.144 6.9a3.47 3.47 0 0 1-1.844.528"
      opacity={0.8}
    />
    <circle cx={6.277} cy={3.932} r={3.496} fill={`url(#b-${suffix})`} />
    <path fill={`url(#c-${suffix})`} d="m13.564 9.54-4.436 6.211 4.436 1.813L18 15.751z" />
    <path fill="#50e6ff" d="m13.564 9.54-4.436 6.211 4.436 1.813z" />
  </svg>
)}
export default SvgMultiTenancy
