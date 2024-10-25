// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVirtualRouter = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={17.329} y2={0.671} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.15} stopColor="#0063af" />
        <stop offset={0.439} stopColor="#006fc3" />
        <stop offset={0.724} stopColor="#0076d0" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <circle cx={9} cy={9} r={8.329} fill={`url(#a-${suffix})`} />
    <path
      fill="#9cebff"
      d="m6.6 4.138 2.3-2.3a.273.273 0 0 1 .387 0l2.3 2.3a.122.122 0 0 1-.086.209h-1.415a.12.12 0 0 0-.122.123v2.873a.1.1 0 0 1-.1.1H8.321a.1.1 0 0 1-.1-.1V4.47a.12.12 0 0 0-.121-.123H6.687a.123.123 0 0 1-.087-.209M11.586 13.862l-2.3 2.3a.273.273 0 0 1-.387 0l-2.3-2.3a.123.123 0 0 1 .087-.209H8.1a.12.12 0 0 0 .122-.123v-2.873a.1.1 0 0 1 .1-.1h1.544a.1.1 0 0 1 .1.1v2.873a.12.12 0 0 0 .122.123H11.5a.122.122 0 0 1 .086.209"
    />
    <path
      fill="#f2f2f2"
      d="m12.884 11.513-2.3-2.3a.273.273 0 0 1 0-.387l2.3-2.3a.122.122 0 0 1 .209.086v1.415a.123.123 0 0 0 .122.123h2.874a.1.1 0 0 1 .1.1v1.542a.1.1 0 0 1-.1.1h-2.874a.12.12 0 0 0-.122.122v1.414a.123.123 0 0 1-.209.085M5.116 6.527l2.3 2.3a.273.273 0 0 1 0 .387l-2.3 2.3a.123.123 0 0 1-.209-.087v-1.415a.12.12 0 0 0-.122-.122H1.911a.1.1 0 0 1-.1-.1V8.247a.1.1 0 0 1 .1-.1h2.874a.123.123 0 0 0 .122-.123V6.613a.122.122 0 0 1 .209-.086"
    />
  </svg>
)}
export default SvgVirtualRouter
