// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureComputeGalleries = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.898} x2={8.898} y1={16.345} y2={1.887} gradientUnits="userSpaceOnUse">
        <stop offset={0.001} stopColor="#773adc" />
        <stop offset={1} stopColor="#a67af4" />
      </linearGradient>
    </defs>
    <path
      fill="#773adc"
      d="M7.855 2.526h-.608a.43.43 0 0 1-.431-.426V.431A.43.43 0 0 1 7.247 0h.608a.43.43 0 0 1 .43.431V2.1a.43.43 0 0 1-.43.426m3.124-.426V.431A.43.43 0 0 0 10.548 0h-.607a.43.43 0 0 0-.431.431V2.1a.43.43 0 0 0 .431.431h.607a.43.43 0 0 0 .431-.431M8.285 17.612v-1.274a.39.39 0 0 0-.385-.388h-.7a.39.39 0 0 0-.388.388v1.274A.39.39 0 0 0 7.2 18h.7a.39.39 0 0 0 .385-.388m2.694 0v-1.274a.39.39 0 0 0-.388-.388H9.9a.39.39 0 0 0-.388.388v1.274A.39.39 0 0 0 9.9 18h.693a.39.39 0 0 0 .386-.388m4.8-9.114h1.777A.445.445 0 0 0 18 8.053V7.46a.445.445 0 0 0-.445-.445h-1.777a.445.445 0 0 0-.445.445v.593a.445.445 0 0 0 .445.447Zm0 2.719h1.777a.445.445 0 0 0 .444-.445v-.594a.444.444 0 0 0-.445-.444h-1.777a.444.444 0 0 0-.445.444v.594a.445.445 0 0 0 .445.445ZM.385 8.5h1.23A.385.385 0 0 0 2 8.113V7.4a.385.385 0 0 0-.385-.385H.385A.385.385 0 0 0 0 7.4v.713a.385.385 0 0 0 .385.387m0 2.719h1.23A.385.385 0 0 0 2 10.832v-.713a.385.385 0 0 0-.385-.385H.385a.385.385 0 0 0-.385.385v.713a.385.385 0 0 0 .385.385Z"
    />
    <rect width={14.327} height={14.458} x={1.734} y={1.887} fill={`url(#a-${suffix})`} rx={0.88} />
    <path fill="#50e6ff" d="M12.097 7.198v3.604l-3.093 1.81V9z" />
    <path fill="#c3f1ff" d="m12.097 7.198-3.093 1.81-3.101-1.81 3.101-1.81z" />
    <path fill="#9cebff" d="M9.004 9.008v3.604l-3.101-1.81V7.198z" />
    <path fill="#c3f1ff" d="M5.903 10.802 9.004 9v3.612z" />
    <path fill="#9cebff" d="M12.097 10.802 9.004 9v3.612z" />
  </svg>
)}
export default SvgAzureComputeGalleries
