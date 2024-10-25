// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgWebTest = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`b-${suffix}`} x1={3.459} x2={3.431} y1={9.738} y2={6.226} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#ccc" />
        <stop offset={0.123} stopColor="#d7d7d7" />
        <stop offset={1} stopColor="#fcfcfc" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={8.547} x2={8.547} y1={13.251} y2={10.102} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#ccc" />
        <stop offset={0.123} stopColor="#d7d7d7" />
        <stop offset={1} stopColor="#fcfcfc" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={13.196} x2={13.296} y1={8.878} y2={18.078} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32d4f5" />
        <stop offset={0.321} stopColor="#31d1f3" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <radialGradient
        id={`a-${suffix}`}
        cx={1848.536}
        cy={3347.483}
        r={50.267}
        gradientTransform="matrix(.15 0 0 .15 -269.742 -494.591)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.183} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
    </defs>
    <path fill={`url(#a-${suffix})`} d="M12.161 13.492A7.54 7.54 0 1 1 2.92 1.576L3 1.517a7.54 7.54 0 0 1 9.165 11.975" />
    <path
      fill="#fff"
      d="M5.491 5.965A11.54 11.54 0 0 1 13.4 2.788a7.5 7.5 0 0 0-1.319-1.281 12.8 12.8 0 0 0-4.164.982A11 11 0 0 0 4.3 4.986a2.44 2.44 0 0 1 1.191.979M1.757 8.994a17 17 0 0 0-.741 2.327 8 8 0 0 0 .552.818 7 7 0 0 0 .491.574 16 16 0 0 1 .961-3.077 2.42 2.42 0 0 1-1.263-.642"
      opacity={0.6}
    />
    <path
      fill="#f2f2f2"
      d="M2.626 4.97a10.6 10.6 0 0 1-.611-2.612 7.5 7.5 0 0 0-.977 1.293 11.7 11.7 0 0 0 .5 2.1 2.43 2.43 0 0 1 1.088-.781"
      opacity={0.55}
    />
    <circle cx={3.439} cy={7.251} r={2.424} fill={`url(#b-${suffix})`} />
    <g fill="#f2f2f2">
      <path
        d="M6.972 11.677a1.57 1.57 0 0 1 .476-1.126A10.7 10.7 0 0 1 5.208 8.9a2.4 2.4 0 0 1-1.324.728 10.5 10.5 0 0 0 1.287 1.14 11 11 0 0 0 1.816 1.107 2 2 0 0 1-.015-.198M12.559 11.864a10.6 10.6 0 0 1-2.442-.284v.1a1.57 1.57 0 0 1-.448 1.1 12.2 12.2 0 0 0 3.026.216A7.5 7.5 0 0 0 13.72 11.8a11 11 0 0 1-1.161.064"
        opacity={0.55}
      />
    </g>
    <circle cx={8.547} cy={11.677} r={1.575} fill={`url(#c-${suffix})`} />
    <path
      fill="#f2f2f2"
      d="M10.484 7.469a1.63 1.63 0 0 1 .543-.876 22.4 22.4 0 0 1-3.959-3.681A15 15 0 0 1 5.308.321a7.4 7.4 0 0 0-.966.371 15.8 15.8 0 0 0 1.894 2.827 23.4 23.4 0 0 0 4.248 3.95"
      opacity={0.7}
    />
    <circle cx={12.136} cy={7.772} r={1.672} fill="#fff" />
    <path
      fill="#f2f2f2"
      d="m14.944 8.9-.284-.15-.027-.015-.263-.142-.048-.027q-.12-.065-.237-.131l-.058-.035-.28-.159a1.6 1.6 0 0 1-.564.82l.332.19.075.042.308.171.03.017c.249.136.5.27.765.4a7 7 0 0 0 .251-.988Z"
      opacity={0.55}
    />
    <circle cx={3.439} cy={7.251} r={2.424} fill="#fff" />
    <circle cx={8.547} cy={11.677} r={1.575} fill="#fff" />
    <path
      fill={`url(#d-${suffix})`}
      d="M17.654 18.006H8.927c-.278 0-.442-.444-.285-.673l3.008-4.384a.35.35 0 0 0 .061-.2v-2.9a.173.173 0 0 0-.173-.172h-.162a.346.346 0 0 1-.345-.345v-.149a.346.346 0 0 1 .345-.346H15.2a.346.346 0 0 1 .345.346v.156a.346.346 0 0 1-.345.345h-.162a.17.17 0 0 0-.172.172v2.9a.35.35 0 0 0 .06.2l3.009 4.377c.165.229-.003.673-.281.673"
    />
    <path
      fill="#fff"
      d="m9.932 16.835 2.285-3.335a.83.83 0 0 0 .147-.472V11.69a.265.265 0 0 1 .265-.265h1.3a.264.264 0 0 1 .265.265v1.433a.56.56 0 0 0 .1.318l2.334 3.394a.2.2 0 0 1-.165.312H10.1a.2.2 0 0 1-.168-.312"
    />
    <path
      fill="#3cd4c2"
      d="M10.615 15.839a4.27 4.27 0 0 1 3.832-.434s.836.468 1.134-.087l1.079 1.5a.289.289 0 0 1-.234.457h-6.32a.289.289 0 0 1-.23-.463Z"
    />
  </svg>
)}
export default SvgWebTest
