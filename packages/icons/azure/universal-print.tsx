// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgUniversalPrint = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.991} x2={8.991} y1={14.11} y2={1.365} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={0.817} stopColor="#a67af4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={12.253} x2={12.253} y1={4.246} y2={9.797} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#c3f1ff" />
        <stop offset={0.999} stopColor="#9cebff" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={12.253} x2={12.253} y1={16.635} y2={12.512} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#c3f1ff" />
        <stop offset={0.999} stopColor="#9cebff" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.982 10.118c0-.818-1.193-1.087-1.652-1.717-.632-.867-.7-1.977-1.855-2.166a5.09 5.09 0 0 0-5.244-4.87 5.225 5.225 0 0 0-4.993 3.4A4.82 4.82 0 0 0 0 9.408a4.893 4.893 0 0 0 5.063 4.7q.227 0 .446-.019h8.2a.8.8 0 0 0 .216-.032 4.09 4.09 0 0 0 4.057-3.939"
    />
    <rect width={9.178} height={3.679} x={7.664} y={6.553} fill="#005ba1" rx={0.3} />
    <rect width={7.367} height={5.55} x={8.57} y={4.246} fill={`url(#b-${suffix})`} rx={0.3} />
    <path fill="#5ea0ef" d="M7.106 8.18H17.4a.6.6 0 0 1 .6.6v6.1H6.507v-6.1a.6.6 0 0 1 .599-.6" />
    <path fill="#0078d4" d="M6.507 14.093H18v1.02H6.507z" />
    <rect width={8.509} height={1.192} x={7.997} y={12.305} fill="#83b9f9" rx={0.3} />
    <circle cx={16.045} cy={10.082} r={0.285} fill="#c3f1ff" />
    <path fill={`url(#c-${suffix})`} d="M8.57 12.512h7.367v3.823a.3.3 0 0 1-.3.3H8.869a.3.3 0 0 1-.3-.3v-3.823z" />
  </svg>
)}
export default SvgUniversalPrint
