// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudServicesClassic = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.99} x2={8.99} y1={16.61} y2={-1.27} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.16} stopColor="#1380da" />
        <stop offset={0.53} stopColor="#3c91e5" />
        <stop offset={0.82} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 10.55a4.11 4.11 0 0 0-3.51-4 5.14 5.14 0 0 0-5.25-5 5.26 5.26 0 0 0-5 3.47A4.87 4.87 0 0 0 0 9.82a4.94 4.94 0 0 0 5.07 4.8h8.65a1.5 1.5 0 0 0 .22 0A4.13 4.13 0 0 0 18 10.55"
    />
    <circle cx={5.24} cy={9.65} r={0.71} fill="#e3e3e3" />
    <path
      fill="#fff"
      d="M7.74 9.92v-.57h-.08l-.61-.2-.16-.39.31-.66-.4-.4h-.08l-.57.3-.39-.16-.25-.69h-.57v.08l-.2.61-.42.16-.65-.31-.4.4v.08l.29.57-.16.39-.7.25V10h.08l.61.2.16.39-.31.66.4.4h.08l.57-.29.39.16.25.69h.57v-.08l.2-.61.39-.16.66.31.4-.4v-.08l-.29-.57.16-.39Zm-2.5.83a1.1 1.1 0 1 1 1.1-1.1 1.09 1.09 0 0 1-1.1 1.1"
    />
    <circle cx={10} cy={6.59} r={0.84} fill="#e3e3e3" />
    <path
      fill="#fff"
      d="M13 6.91v-.68h-.09L12.17 6 12 5.49l.37-.8-.48-.48h-.09l-.69.35-.46-.19-.3-.83h-.71v.1l-.24.73-.47.19-.78-.37-.48.48.05.09.28.74-.16.5-.84.27V7h.1l.73.24.17.45-.37.8.5.51.1-.05.68-.35.47.19.3.83h.68v-.1l.24-.73.47-.19.79.37.48-.48-.05-.09-.29-.72.19-.47Zm-3 1a1.32 1.32 0 1 1 1.32-1.32A1.31 1.31 0 0 1 10 7.91"
    />
  </svg>
)}
export default SvgCloudServicesClassic
