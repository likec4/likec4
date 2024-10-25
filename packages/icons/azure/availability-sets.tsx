// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAvailabilitySets = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={10.31} x2={10.31} y1={12.7} y2={6.83} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={10.31} x2={10.31} y1={14.97} y2={12.7} gradientUnits="userSpaceOnUse">
        <stop offset={0.15} stopColor="#ccc" />
        <stop offset={1} stopColor="#707070" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M2.12.5h1.97v.57H2.12zM16.63 1.07h.32v.31h.55V.5h-.87zM1.41 16.89h-.28v-.32H.5v.93h.91zM16.95 16.6v.29h-.32v.61h.87v-.9zM1.13 1.36v-.29h.28V.5H.5v.86z"
    />
    <rect width={8.79} height={5.88} x={3.37} y={3.55} fill="#0078d4" rx={0.29} />
    <path fill="#50e6ff" d="M9.23 5.64v1.71l-1.46.86V6.49z" />
    <path fill="#c3f1ff" d="m9.23 5.64-1.46.86-1.47-.86 1.47-.86z" />
    <path fill="#9cebff" d="M7.77 6.5v1.71L6.3 7.35V5.64z" />
    <rect width={8.79} height={5.88} x={5.91} y={6.83} fill={`url(#a-${suffix})`} rx={0.29} />
    <path fill="#50e6ff" d="M11.77 8.91v1.71l-1.46.86V9.77z" />
    <path fill="#c3f1ff" d="m11.77 8.91-1.46.86-1.47-.86 1.47-.86z" />
    <path fill="#9cebff" d="M10.31 9.77v1.71l-1.47-.86V8.91z" />
    <path fill="#c3f1ff" d="m8.84 10.62 1.47-.85v1.71z" />
    <path fill="#9cebff" d="m11.77 10.62-1.46-.85v1.71z" />
    <path
      fill={`url(#b-${suffix})`}
      d="M12.07 14.48c-.87-.14-.9-.77-.9-1.78H9.44c0 1 0 1.64-.9 1.78a.51.51 0 0 0-.43.49h4.4a.51.51 0 0 0-.44-.49"
    />
    <path
      fill="#0078d4"
      d="M5.07.5h1.97v.57H5.07zM8.01.5h1.97v.57H8.01zM10.96.5h1.97v.57h-1.97zM13.91.5h1.97v.57h-1.97zM2.14 16.89h1.97v.57H2.14zM5.08 16.89h1.97v.57H5.08zM8.03 16.89H10v.57H8.03zM10.98 16.89h1.97v.57h-1.97zM13.92 16.89h1.97v.57h-1.97zM16.93 2.05h.57v1.97h-.57zM16.93 4.99h.57v1.97h-.57zM16.93 7.94h.57v1.97h-.57zM16.93 10.88h.57v1.97h-.57zM16.93 13.83h.57v1.97h-.57zM.5 2.03h.57V4H.5zM.5 4.98h.57v1.97H.5zM.5 7.92h.57v1.97H.5zM.5 10.87h.57v1.97H.5zM.5 13.81h.57v1.97H.5z"
    />
  </svg>
)}
export default SvgAvailabilitySets
