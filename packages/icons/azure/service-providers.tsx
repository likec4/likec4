// @ts-nocheck

import type { SVGProps } from 'react'
const SvgServiceProviders = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={6.49} x2={6.49} y1={6.29} y2={18.38} gradientUnits="userSpaceOnUse">
        <stop offset={0.1} stopColor="#54aef0" />
        <stop offset={1} stopColor="#1988d9" />
      </linearGradient>
      <linearGradient id="b" x1={7.13} x2={8.01} y1={-0.19} y2={10.79} gradientUnits="userSpaceOnUse">
        <stop offset={0.1} stopColor="#54aef0" />
        <stop offset={1} stopColor="#1988d9" />
      </linearGradient>
      <linearGradient id="c" x1={13.76} x2={13.76} y1={18.05} y2={10.25} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.6} stopColor="#81ce31" />
        <stop offset={0.82} stopColor="#86d633" />
      </linearGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M9.35 10.31a.51.51 0 0 1 .51-.51h2.93a6.53 6.53 0 0 0-5.31-2.43C3 7.37.65 10.18.2 14.77a1.29 1.29 0 0 0 1.16 1.42h8Z"
    />
    <path fill="#fff" d="M7.48 8.34a4.1 4.1 0 0 1-2.21-.65l2.19 5.71 2.17-5.68a4 4 0 0 1-2.15.62" opacity={0.8} />
    <circle cx={7.48} cy={4.25} r={4.08} fill="url(#b)" />
    <path
      fill="url(#c)"
      d="M12.59 15.71h2.34v2.34h-2.34Zm-2.73-3.12h2.34v-2.34h-2a.33.33 0 0 0-.33.33Zm.33 5.46h2v-2.34H9.86v2a.33.33 0 0 0 .33.34m-.33-2.73h2.34V13H9.86Zm5.45 2.73h2a.32.32 0 0 0 .32-.33v-2h-2.32Zm-2.72-2.73h2.34V13h-2.34Zm2.72 0h2.34V13h-2.34Zm0-5.07v2.34h2.34v-2a.32.32 0 0 0-.32-.33Zm-2.72 2.34h2.34v-2.34h-2.34Z"
    />
  </svg>
)
export default SvgServiceProviders
