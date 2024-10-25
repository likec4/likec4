// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgQodana = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <linearGradient id={`a-${suffix}`} x1={-2.61} x2={101.85} y1={100.51} y2={85.49} gradientUnits="userSpaceOnUse">
      <stop offset={0.18} stopColor="#fc801d" />
      <stop offset={0.63} stopColor="#ff318c" />
    </linearGradient>
    <linearGradient id={`b-${suffix}`} x1={-17.85} x2={130.71} y1={-1.57} y2={108.84} gradientUnits="userSpaceOnUse">
      <stop offset={0} stopColor="#ff318c" />
      <stop offset={0.4} stopColor="#b74af7" />
      <stop offset={0.87} stopColor="#ff318c" />
    </linearGradient>
    <linearGradient id={`c-${suffix}`} x1={-35.11} x2={129.64} y1={47.35} y2={8.71} gradientUnits="userSpaceOnUse">
      <stop offset={0} stopColor="#ff318c" />
      <stop offset={0.2} stopColor="#d73bab" />
      <stop offset={0.51} stopColor="#9d4ad8" />
      <stop offset={0.75} stopColor="#7953f4" />
      <stop offset={0.87} stopColor="#6b57ff" />
    </linearGradient>
    <path
      fill={`url(#a-${suffix})`}
      d="M86 55.73 24.27 68.67a37 37 0 0 0-4.77 1.06A24.23 24.23 0 0 0 7.16 78.2c-18.43 23.94 1.34 55.23 29.6 49l67.72-9.81a28.28 28.28 0 0 0 17.43-12c17.46-26.07-5.15-58.68-35.91-49.66"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M52.07 8.15c-7.61-7-18.79-10.25-31.34-6.58a25.8 25.8 0 0 0-13.12 9C-5 27-.78 46.62 11.87 56.75L79.24 113a32.32 32.32 0 0 0 25.24 4.35 28.28 28.28 0 0 0 17.43-12c10.4-15.47 6.59-33.35-4.7-43.35z"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M29.34.15a43.5 43.5 0 0 0-8.61 1.42 25.8 25.8 0 0 0-13.12 9C-12 36 9 69.3 39.08 62.67l80.73-30.45a9.28 9.28 0 0 0 5.72-3.92c5-7.54-.11-16.73-8.32-16.78L32.69 0c-1.2 0-2.32.07-3.35.15"
    />
    <path d="M24 24h80v80H24z" />
    <path
      fill="#fff"
      d="M34 89h30v5H34zm26-24.19-3.3-3a16.3 16.3 0 0 1-8.89 2.56C38.58 64.42 32 57.54 32 49c0-8.51 6.71-15.48 16-15.48s15.86 6.88 15.86 15.39V49a15.4 15.4 0 0 1-2.65 8.59l3.08 2.61zm-8.17-7.27L47 53.39l4.19-4.7 4.91 4.45a10.4 10.4 0 0 0 .78-4.14 9.1 9.1 0 0 0-9.07-9.41c-5.3 0-9 4.19-9 9.32V49a9.09 9.09 0 0 0 9.06 9.4 8.9 8.9 0 0 0 3.96-.86M68.87 34h11.28c9.4 0 15.9 6.46 15.9 14.88V49c0 8.42-6.5 15-15.9 15H68.87zm6.58 6v18h4.7c5.38 0 9-3.64 9-8.94V49a8.6 8.6 0 0 0-9-9z"
    />
  </svg>
)}
export default SvgQodana
