// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEntraConnect = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={7.669}
        x2={14.031}
        y1={779.631}
        y2={787.067}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#225086" />
        <stop offset={1} stopColor="#0055c5" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={6.341}
        x2={6.341}
        y1={778.631}
        y2={794.82}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#6df" />
        <stop offset={1} stopColor="#0294e4" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={8.968}
        x2={8.968}
        y1={776.431}
        y2={795.251}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#44dbf9" />
        <stop offset={1} stopColor="#cbf8ff" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={13.451}
        x2={13.451}
        y1={775.2}
        y2={791.203}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#041642" />
        <stop offset={1} stopColor="#041642" stopOpacity={0.25} />
      </linearGradient>
      <linearGradient
        id={`e-${suffix}`}
        x1={-550.516}
        x2={-550.516}
        y1={1008.032}
        y2={1017.064}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.001} stopColor="#773adc" />
        <stop offset={0.342} stopColor="#8b55e6" />
        <stop offset={0.756} stopColor="#9f70f0" />
        <stop offset={1} stopColor="#a67af4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.583 9.451 10.11 1.022a1.545 1.545 0 0 0-2.286 0L.352 9.451c-.577.652-.426 1.635.322 2.103l7.472 4.671a1.56 1.56 0 0 0 1.642 0l7.472-4.671c.748-.467.899-1.452.322-2.103Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M10.111 1.022a1.545 1.545 0 0 0-2.286 0L.353 9.451c-.577.652-.426 1.635.322 2.103l3.115 1.947c.387.241 1.029.509 1.709.509.619 0 1.193-.179 1.67-.485h.002l1.798-1.124-4.348-2.718 4.458-5.029a3.04 3.04 0 0 1 2.294-1.022c.47 0 .914.107 1.309.291l-2.57-2.899z"
    />
    <path fill={`url(#c-${suffix})`} d="m4.619 9.683.052.031 4.297 2.687 4.348-2.718h.001-.001L8.968 4.776z" />
    <path
      fill={`url(#d-${suffix})`}
      fillOpacity={0.5}
      d="M8.968 16.459c.286 0 .572-.078.821-.233l7.472-4.671c.748-.467.899-1.452.322-2.103l-7.472-8.43A1.52 1.52 0 0 0 8.968.517V16.46Z"
      opacity={0.5}
    />
    <circle cx={13.484} cy={12.968} r={4.516} fill={`url(#e-${suffix})`} />
    <path
      fill="#fff"
      d="M15.257 12.36h-.689a.407.407 0 0 0 0 .813h1.49a.407.407 0 0 0 .406-.407v-1.761a.407.407 0 0 0-.813-.013v.41900000000000004a2.7 2.7 0 0 0-2.168-1.084 2.67 2.67 0 0 0-2.074.96.407.407 0 0 0 .625.52c.358-.429.89-.674 1.449-.666.787 0 1.492.485 1.773 1.219ZM11.317 15.07v-.406a2.716 2.716 0 0 0 4.239.129.407.407 0 0 0-.619-.527 1.903 1.903 0 0 1-3.166-.415h.63a.407.407 0 0 0 .013-.813H10.91a.406.406 0 0 0-.406.406v1.626a.407.407 0 0 0 .813.013z"
    />
  </svg>
)}
export default SvgEntraConnect
