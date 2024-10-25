// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgTags = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.84} x2={9.84} y1={3.825} y2={17.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#c69aeb" />
        <stop offset={1} stopColor="#6f4bb2" />
      </linearGradient>
    </defs>
    <path
      fill="#773adc"
      d="M14.977 2.5 13.1.635A.47.47 0 0 0 12.753.5L9.271.627a.46.46 0 0 0-.312.135L1.342 8.339a.46.46 0 0 0 0 .654l5.074 5.047a.465.465 0 0 0 .657 0L14.7 6.454a.46.46 0 0 0 .134-.288l.279-3.3a.46.46 0 0 0-.136-.366m-2.266 1.237a.843.843 0 1 1 .848-.843.845.845 0 0 1-.848.843"
    />
    <path
      fill="#341a6e"
      d="M12.711 1.383a1.512 1.512 0 1 0 1.52 1.511 1.515 1.515 0 0 0-1.52-1.511m.832 1.676a.848.848 0 1 1-1-.992.84.84 0 0 1 1 .992"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M16.658 5.828 14.78 3.96a.47.47 0 0 0-.346-.135l-3.483.126a.47.47 0 0 0-.312.135l-7.616 7.577a.46.46 0 0 0 0 .654L8.1 17.365a.467.467 0 0 0 .657 0l7.623-7.586a.46.46 0 0 0 .134-.288l.278-3.3a.46.46 0 0 0-.134-.363m-2.266 1.234a.843.843 0 1 1 .847-.843.846.846 0 0 1-.847.843"
    />
    <path
      fill="#552f99"
      d="M14.392 4.707a1.512 1.512 0 1 0 1.519 1.512 1.516 1.516 0 0 0-1.519-1.512m.831 1.677a.848.848 0 1 1-1-.992.842.842 0 0 1 1 .992"
    />
    <path
      fill="#fff"
      d="M15.223 6.384a.848.848 0 1 1-1-.992.842.842 0 0 1 1 .992M13.543 3.059a.848.848 0 1 1-1-.992.84.84 0 0 1 1 .992"
    />
  </svg>
)}
export default SvgTags
