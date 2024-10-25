// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIoTTwinMaker = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x2={1}
        y1={79}
        y2={80}
        gradientTransform="matrix(80 0 0 -80 0 6400)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#1b660f" />
        <stop offset={1} stopColor="#6cae3e" />
      </linearGradient>
    </defs>
    <path d="M0 0h80v80H0z" data-name="Icon-Architecture/64/Arch_AWS-IoT-TwinMaker_64" fill={`url(#a-${suffix})`} />
    <path
      d="M67.98 38.88c0-7.872-5.991-10.246-8.808-10.924-.427-3.812-2.383-6.552-5.313-7.389a6.32 6.32 0 0 0-5.886 1.344 17.3 17.3 0 0 0-3.415-5.22 14.31 14.31 0 0 0-16.52-3.382c-4.962 2.166-8.705 8.137-8.705 13.89q0 .518.033 1.034c-2.711.919-7.346 3.522-7.346 10.56q0 .672.058 1.297a11.275 11.275 0 0 0 9.902 9.808v17.084a1 1 0 0 0 1 1h22a1 1 0 0 0 1-1v-7h4v-2h-4v-13a1 1 0 0 0-1-1h-22a1 1 0 0 0-1 1v2.898a9.22 9.22 0 0 1-7.91-7.972q-.05-.536-.05-1.115c0-6.12 4.087-8.17 6.587-8.85a1 1 0 0 0 .82-1.1 14 14 0 0 1-.094-1.643c0-4.925 3.297-10.221 7.505-12.058a12.34 12.34 0 0 1 14.283 2.94 16 16 0 0 1 3.551 6.012 1 1 0 0 0 1.76.259 4.49 4.49 0 0 1 4.877-1.863c2.22.634 3.68 2.924 3.918 6.135v.005a1 1 0 0 0 .814 1.131c2.387.423 7.939 2.158 7.939 9.118a8.6 8.6 0 0 1-7 8.92v-3.817h-2v4.999l-.001 1h.001v2h2v-2.155c2.463-.516 9-2.667 9-10.947m-44 7.102h20v20h-20Zm20-10h6v2h-6Zm-8 0h4v2h-3v3h-2v-4a1 1 0 0 1 1-1m21 19h2v4a1 1 0 0 1-1 1h-4v-2h3Zm0-14v-3h-3v-2h4a1 1 0 0 1 1 1v4Z"
      fill="#fff"
    />
  </svg>
)}
export default SvgIoTTwinMaker
