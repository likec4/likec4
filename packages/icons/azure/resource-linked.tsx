// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgResourceLinked = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={9}
        x2={9}
        y1={19.848}
        y2={-1.014}
        gradientTransform="rotate(45 9 9)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={0.546} stopColor="#6dad2a" />
        <stop offset={0.999} stopColor="#76bc2d" />
      </linearGradient>
    </defs>
    <rect width={13.079} height={13.079} x={2.46} y={2.46} fill={`url(#a-${suffix})`} rx={0.6} transform="rotate(-45 9 9)" />
    <path
      fill="#fff"
      d="M11.839 6.505v-.652l-.091-.034-.7-.229-.183-.446.355-.755-.458-.458-.092.046-.652.332-.446-.183-.286-.79h-.65l-.036.092-.229.7-.446.183-.744-.355-.458.458.046.091.332.652-.181.443-.8.286v.652l.092.035.7.229.184.446L6.737 8l.457.457.092-.045.652-.332.446.183.286.789h.652l.035-.091.229-.7.446-.183.755.355.457-.458-.044-.086-.332-.652.183-.446Zm-2.86.947A1.256 1.256 0 1 1 10.234 6.2a1.255 1.255 0 0 1-1.255 1.252M10.512 10.914l-.793-.014h-.542l-.39-.006a1.51 1.51 0 0 0-1.45 1.306l.542.008a.95.95 0 0 1 .9-.728l.39.006.542.008.794.011a1.041 1.041 0 0 1-.03 2.069l-1.725-.025a.95.95 0 0 1-.878-.753l-.543-.008a1.51 1.51 0 0 0 1.411 1.346l1.726.025a1.547 1.547 0 0 0 1.478-1.6 1.547 1.547 0 0 0-1.432-1.645"
    />
    <path
      fill="#b4ec36"
      d="m8.269 12.21-.39-.005-.542-.005-.794-.012a1.04 1.04 0 0 1 .03-2.068l1.725.025a.95.95 0 0 1 .879.753l.542.007a1.51 1.51 0 0 0-1.412-1.352l-1.726-.025A1.55 1.55 0 0 0 5.1 11.13a1.55 1.55 0 0 0 1.432 1.644l.793.011.543.008.389.006a1.51 1.51 0 0 0 1.45-1.308l-.542-.008a.95.95 0 0 1-.896.727"
    />
    <circle cx={8.979} cy={6.196} r={0.85} fill="#b4ec36" />
  </svg>
)}
export default SvgResourceLinked
