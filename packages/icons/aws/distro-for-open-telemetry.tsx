// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDistroForOpenTelemetry = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M66 18h-3c-2.627 0-2.958 1.678-3 2.061V30h-2v-9h-7v16h8a1 1 0 0 1 .997.929C60.03 38.265 60.333 40 63 40h3zM14 31h14v-4H14zm54-14v24a1 1 0 0 1-1 1h-4c-2.986 0-4.331-1.646-4.799-3H50a1 1 0 0 1-1-1v-1h-3v-2h3V23H31.801C30.27 23 30 23.649 30 27v4c0 3.351.27 4 1.801 4H37v1.94h-5.199c-2.871 0-3.572-1.879-3.744-3.94H14v4h-2V21h2v4h14.057c.172-2.061.873-3.94 3.744-3.94H49V20a1 1 0 0 1 1-1h8.201c.468-1.354 1.813-3 4.799-3h4a1 1 0 0 1 1 1M55 51h10v2h-9.262l-3.425 11.139a1 1 0 0 1-.956.706h-.004a1 1 0 0 1-.955-.716L41.261 33.29 33.7 58.739a1 1 0 0 1-.897.714.99.99 0 0 1-.978-.598l-4.334-9.925-2.546 7.396A1 1 0 0 1 24 57H13v-2h10.287l3.149-9.147a1 1 0 0 1 .905-.673.99.99 0 0 1 .956.598l4.265 9.768 7.741-26.057a1 1 0 0 1 1.918.001l9.154 30.895 2.669-8.679c.129-.419.517-.706.956-.706"
      />
    </g>
  </svg>
)}
export default SvgDistroForOpenTelemetry
