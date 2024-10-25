// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCommunityImages = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={10.564} x2={10.564} y1={1.333} y2={16.765} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#999" />
        <stop offset={0.999} stopColor="#767676" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={10.564} x2={10.564} y1={5.379} y2={12.655} gradientUnits="userSpaceOnUse">
        <stop offset={0.001} stopColor="#b3b3b3" />
        <stop offset={1} stopColor="#999" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={5.456} x2={5.456} y1={0.351} y2={17.782} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 8.989a7.5 7.5 0 0 1-.418 2.468 8 8 0 0 1-.19.486 7 7 0 0 1-.378.756 7.45 7.45 0 0 1-4.647 3.518h-.014l-.062.016-.031.006a7 7 0 0 1-.9.154 7 7 0 0 1-.443.033h-.081c-.089 0-.178.006-.267.006A7.44 7.44 0 0 1 3.494 11.3a7 7 0 0 1-.249-1 7.4 7.4 0 0 1-.116-1.318 7.5 7.5 0 0 1 .106-1.264 7.44 7.44 0 0 1 7.329-6.183c.116 0 .232 0 .348.008A7.443 7.443 0 0 1 18 8.989"
    />
    <ellipse cx={10.564} cy={8.989} fill={`url(#b-${suffix})`} rx={3.505} ry={3.511} />
    <rect width={10.912} height={16.825} y={0.588} fill={`url(#c-${suffix})`} rx={0.526} />
    <path fill="#50e6ff" d="m8.397 7.262.021 3.44-2.937 1.745L5.46 9z" />
    <path fill="#c3f1ff" d="M8.397 7.262 5.461 9.007l-2.966-1.71L5.44 5.552z" />
    <path fill="#9cebff" d="m5.461 9.007.02 3.44-2.965-1.709-.021-3.441z" />
    <path fill="#c3f1ff" d="M2.516 10.738 5.46 9l.021 3.447z" />
    <path fill="#9cebff" d="M8.418 10.702 5.46 9l.021 3.447z" />
  </svg>
)}
export default SvgCommunityImages
