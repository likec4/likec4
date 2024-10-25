// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgProductionReadyDatabase = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={0.072}
        x2={12.822}
        y1={12.971}
        y2={12.971}
        gradientTransform="rotate(.147 1102.774 1005.745)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.068} stopColor="#0060a9" />
        <stop offset={0.356} stopColor="#0071c8" />
        <stop offset={0.517} stopColor="#0078d4" />
        <stop offset={0.642} stopColor="#0074cd" />
        <stop offset={0.82} stopColor="#006abb" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M9.01 5.145c-3.521-.009-6.372-1.056-6.369-2.339l-.032 12.355c0 1.272 2.8 2.312 6.282 2.338h.087c3.521.009 6.378-1.023 6.381-2.306l.032-12.355c-.003 1.284-2.86 2.316-6.381 2.307"
    />
    <path
      fill="#e6e6e6"
      d="M15.391 2.839c0 1.282-2.86 2.315-6.381 2.306S2.638 4.089 2.641 2.806 5.5.491 9.022.5s6.372 1.056 6.369 2.339"
    />
    <path
      fill="#50e6ff"
      d="M13.9 2.647c0 .816-2.192 1.471-4.89 1.464s-4.883-.673-4.881-1.489S6.321 1.151 9.02 1.158s4.885.673 4.883 1.489"
    />
    <path
      fill="#198ab3"
      d="M9.015 2.975a11.8 11.8 0 0 0-3.872.55 11.3 11.3 0 0 0 3.87.586 11.3 11.3 0 0 0 3.872-.566 11.7 11.7 0 0 0-3.87-.57"
    />
    <path
      fill="#fff"
      d="m8.32 13.033-.602.602a.26.26 0 0 1-.37 0l-2.394-2.393a.26.26 0 0 1-.002-.372l.418-.417a.26.26 0 0 1 .37 0z"
    />
    <path
      fill="#f2f2f2"
      d="m7.356 13.639-.602-.602 5.504-5.505a.26.26 0 0 1 .371 0l.417.417a.26.26 0 0 1 0 .37l-5.319 5.32a.26.26 0 0 1-.37 0"
    />
  </svg>
)}
export default SvgProductionReadyDatabase
