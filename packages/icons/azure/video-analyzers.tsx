// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVideoAnalyzers = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={0.199} y2={15.707} gradientUnits="userSpaceOnUse">
        <stop offset={0.117} stopColor="#5ea0ef" />
        <stop offset={0.271} stopColor="#4595e8" />
        <stop offset={0.531} stopColor="#1f85dd" />
        <stop offset={0.741} stopColor="#087cd6" />
        <stop offset={0.873} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14.506 7.464a5.16 5.16 0 0 0-5.294-4.871 5.31 5.31 0 0 0-4.977 3.388A4.97 4.97 0 0 0 0 10.64a4.884 4.884 0 0 0 5 4.768h8.98A4.024 4.024 0 0 0 18 11.381a4.08 4.08 0 0 0-3.494-3.917"
    />
    <path
      fill="#83b9f9"
      d="M13.786 10.198 9.299 8.531l-.116.288.073-.264-3.984-.877-.191.668 3.362.729-4.314 1.783.332.592L8.915 9.6l.797 3.51.689-.085-.812-3.623 3.933 1.438z"
    />
    <path
      fill="#9cebff"
      d="M4.581 8.6a.881.881 0 1 0 .156-1.236l-.02.016a.875.875 0 0 0-.136 1.22m-1 3.117a.886.886 0 1 0 .15-1.245.886.886 0 0 0-.15 1.245m9.262-.77A.877.877 0 1 0 13 9.72a.867.867 0 0 0-.162 1.214ZM9.361 13.653a.877.877 0 1 0 .156-1.23.867.867 0 0 0-.167 1.217Z"
    />
    <path
      fill="#c3f1ff"
      d="M11.736 9.038a.264.264 0 0 0 0-.458L9.8 7.46 7.858 6.341a.264.264 0 0 0-.4.229v4.478a.264.264 0 0 0 .4.229L9.8 10.158Z"
    />
  </svg>
)}
export default SvgVideoAnalyzers
