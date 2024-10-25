// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgArcKubernetes = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={3.875} x2={8.777} y1={2.197} y2={2.197} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.171} x2={14.064} y1={2.24} y2={2.24} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={1.368} x2={6.27} y1={6.8} y2={6.8} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={6.647} x2={11.54} y1={6.77} y2={6.77} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`e-${suffix}`} x1={11.925} x2={16.828} y1={6.808} y2={6.808} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`f-${suffix}`} x1={3.815} x2={8.717} y1={11.454} y2={11.454} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`g-${suffix}`} x1={9.102} x2={14.004} y1={11.488} y2={11.488} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
    </defs>
    <path
      fill="#5ea0ef"
      d="M17.947 15.105c-.167.733-1.083 1.456-2.738 2.018a22.6 22.6 0 0 1-12.69.018C.994 16.6.171 15.917.042 15.213c-.022-.124 0-2.058 0-2.058l17.935-.166s-.009 2.026-.03 2.116"
    />
    <ellipse cx={9.001} cy={13.115} fill="#50e6ff" rx={8.976} ry={3.103} transform="rotate(-.575 9.002 13.099)" />
    <path fill={`url(#a-${suffix})`} d="M6.322.041 3.875.494v3.337l2.447.522 2.455-.984V.879z" />
    <path
      fill="none"
      d="m6.416 4.3 2.241-.9a.17.17 0 0 0 .1-.12V1.016a.18.18 0 0 0-.108-.154L6.382.092h-.1L4.055.5a.17.17 0 0 0-.129.154v3.02a.164.164 0 0 0 .129.163l2.25.47a.3.3 0 0 0 .111-.007"
    />
    <path fill={`url(#b-${suffix})`} d="M11.617.084 9.171.537v3.337l2.446.522 2.447-.993V.922z" />
    <path fill={`url(#c-${suffix})`} d="m3.815 4.644-2.447.453v3.337l2.447.522 2.455-.984v-2.49z" />
    <path fill={`url(#d-${suffix})`} d="m9.094 4.609-2.447.454v3.336l2.447.531 2.446-.993V5.448z" />
    <path fill={`url(#e-${suffix})`} d="m14.372 4.652-2.447.454v3.336l2.447.522 2.456-.984V5.491z" />
    <path fill={`url(#f-${suffix})`} d="m6.262 9.298-2.447.445v3.336l2.447.531 2.455-.993v-2.481z" />
    <path
      fill="none"
      d="m6.356 13.541 2.233-.855a.16.16 0 0 0 .1-.154v-2.225a.17.17 0 0 0-.112-.188l-2.258-.77a.15.15 0 0 0-.1 0L4 9.751a.16.16 0 0 0-.137.163v3.028a.16.16 0 0 0 .128.163l2.25.436a.2.2 0 0 0 .115 0"
    />
    <path fill={`url(#g-${suffix})`} d="m11.549 9.332-2.447.453v3.337l2.447.522 2.455-.984v-2.49z" />
    <path
      fill="#341a6e"
      d="M3.875.494v3.337l2.472.522V.075Zm1.044 3.08-.693-.137V.871L4.919.76ZM6 3.771l-.8-.128V.708L6 .571ZM9.171.537v3.337l2.455.522V.118Zm1.035 3.08-.693-.137V.914L10.206.8Zm1.078.2-.8-.128V.751l.8-.145ZM1.36 5.1v3.308l2.472.522V4.652ZM2.4 8.186l-.7-.146V5.474l.693-.12Zm1.086.222-.8-.128V5.311l.8-.137Zm3.161-3.345v3.345l2.464.522V4.652Zm1.035 3.088-.693-.145V5.439l.693-.119Zm1.078.189-.8-.129V5.277l.8-.137Zm3.165-3.234v3.3l2.475.524V4.652Zm1.044 3.088-.693-.145V5.482l.693-.12Zm1.078.188-.795-.128V5.32l.8-.137ZM3.815 9.743v3.336l2.473.531V9.264Zm1.044 3.088-.693-.145v-2.567L4.859 10Zm1.078.2-.8-.128V9.957l.8-.137ZM9.1 9.785v3.337l2.473.522V9.366Zm1.044 3.089-.693-.146v-2.566l.693-.12Zm1.078.188-.8-.128V10l.8-.137Z"
    />
  </svg>
)}
export default SvgArcKubernetes
