// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVirtualInstanceForSap = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={12.48} y2={1.147} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#003067" />
        <stop offset={0.037} stopColor="#00346c" />
        <stop offset={0.239} stopColor="#004583" />
        <stop offset={0.456} stopColor="#005194" />
        <stop offset={0.695} stopColor="#00599e" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={9}
        x2={9}
        y1={684.663}
        y2={689.036}
        gradientTransform="matrix(1 0 0 -1 0 701.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.15} stopColor="#ccc" />
        <stop offset={1} stopColor="#707070" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={0.003}
        x2={0.003}
        y1={-27.428}
        y2={-28.757}
        gradientTransform="matrix(5 0 0 -5 9.126 -133.758)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#00aeef" />
        <stop offset={0.212} stopColor="#0097dc" />
        <stop offset={0.519} stopColor="#007cc5" />
        <stop offset={0.792} stopColor="#006cb8" />
        <stop offset={1} stopColor="#0066b3" />
      </linearGradient>
    </defs>
    <rect width={17} height={11.333} x={0.5} y={1.147} fill={`url(#a-${suffix})`} rx={0.567} />
    <path
      fill={`url(#b-${suffix})`}
      d="M12.409 15.909c-1.681-.265-1.747-1.474-1.747-3.429H7.328c0 1.955-.056 3.164-1.737 3.429a.944.944 0 0 0-.841.944h8.5a.944.944 0 0 0-.841-.944"
    />
    <g fillRule="evenodd">
      <path fill={`url(#c-${suffix})`} d="M2.427 10.028h6.788l6.643-6.644H2.427z" />
      <path
        fill="#fff"
        d="M10.4 4.713H9.071l.005 3.119-1.155-3.121H6.775L5.79 7.318c-.105-.664-.79-.892-1.33-1.064-.357-.114-.735-.283-.731-.469 0-.152.2-.294.6-.273a2.2 2.2 0 0 1 .968.262l.459-.8a3.6 3.6 0 0 0-1.5-.354 1.82 1.82 0 0 0-1.325.48 1.12 1.12 0 0 0-.316.771 1.04 1.04 0 0 0 .454.923 3.1 3.1 0 0 0 .9.412c.367.113.667.212.663.423a.31.31 0 0 1-.087.206.58.58 0 0 1-.426.134 1.83 1.83 0 0 1-1.1-.313l-.408.811a2.84 2.84 0 0 0 1.444.377h.12a1.8 1.8 0 0 0 1.139-.36l.049-.041-.047.257h1.12l.2-.514a2.3 2.3 0 0 0 1.4.006l.14.508h2.008V7.528h.427c1.033 0 1.644-.526 1.644-1.407 0-.982-.594-1.41-1.857-1.41ZM7.342 7.379a1.2 1.2 0 0 1-.423-.074l.419-1.322h.008l.412 1.326a1.3 1.3 0 0 1-.416.07m3.133-.759h-.291V5.554h.291c.389 0 .7.129.7.526s-.31.54-.7.54"
      />
    </g>
  </svg>
)}
export default SvgVirtualInstanceForSap
