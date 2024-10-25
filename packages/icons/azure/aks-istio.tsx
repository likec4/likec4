// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAksIstio = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`b-${suffix}`} x1={-1.024} x2={15.931} y1={19.038} y2={2.083} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={2.077} x2={19.04} y1={2.063} y2={19.026} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={1} stopColor="#003067" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={2.069} x2={19.024} y1={15.917} y2={-1.038} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`e-${suffix}`} x1={-1.04} x2={15.923} y1={-1.026} y2={15.937} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#83b9f9" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <radialGradient id={`a-${suffix}`} cx={7.495} cy={7.696} r={5.405} gradientUnits="userSpaceOnUse">
        <stop offset={0.131} stopColor="#a67af4" />
        <stop offset={0.452} stopColor="#a478f1" />
        <stop offset={0.602} stopColor="#9d72ea" />
        <stop offset={0.717} stopColor="#9167dd" />
        <stop offset={0.814} stopColor="#8158cb" />
        <stop offset={0.898} stopColor="#6c45b3" />
        <stop offset={0.97} stopColor="#552f99" />
      </radialGradient>
    </defs>
    <circle cx={9.056} cy={9} r={3.49} fill={`url(#a-${suffix})`} />
    <path
      fill={`url(#b-${suffix})`}
      d="m6.198 12.877 1.404 1.403-.001-3.868H3.733l1.404 1.404-3.719 3.719-1.404-1.403L.016 18h3.868L2.48 16.596z"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M18 17.984v-3.868l-1.404 1.404-3.719-3.718 1.403-1.404-3.868.001v3.868l1.404-1.404 3.719 3.719-1.403 1.404z"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="m16.582 2.465 1.404 1.403L17.984 0h-3.868l1.404 1.404-3.718 3.719-1.404-1.403.001 3.868h3.868l-1.404-1.404z"
    />
    <path
      fill={`url(#e-${suffix})`}
      d="M7.588 7.601V3.733L6.184 5.137 2.465 1.418 3.868.014 0 .016v3.868L1.404 2.48l3.719 3.718L3.72 7.602z"
    />
  </svg>
)}
export default SvgAksIstio
