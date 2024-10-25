// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDashboardHub = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={4.984} x2={8.956} y1={18.749} y2={4.782} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#258277" />
        <stop offset={0.2} stopColor="#27887d" />
        <stop offset={0.5} stopColor="#2c9a8d" />
        <stop offset={1} stopColor="#37c2b1" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={6.489} x2={9.98} y1={19.216} y2={5.02} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#258277" />
        <stop offset={0.3} stopColor="#2ea193" />
        <stop offset={0.7} stopColor="#34b9a9" />
        <stop offset={1} stopColor="#37c2b1" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={10.741} x2={10.741} y1={12.441} y2={1.908} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#37c2b1" />
        <stop offset={1} stopColor="#3cd4c2" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14.087 5.605H.442a.427.427 0 0 0-.442.41v9.464a.43.43 0 0 0 .443.4h13.644a.42.42 0 0 0 .435-.4V6a.42.42 0 0 0-.435-.395"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M15.826 3.866H2.182a.43.43 0 0 0-.443.411v9.463a.426.426 0 0 0 .443.394h13.644a.42.42 0 0 0 .435-.394V4.26a.42.42 0 0 0-.435-.394"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M17.556 2.149H3.933a.426.426 0 0 0-.441.411v9.448a.426.426 0 0 0 .442.394h13.622a.42.42 0 0 0 .434-.394V2.543a.417.417 0 0 0-.434-.394"
    />
    <rect width={1.234} height={7.53} x={13.527} y={3.414} fill="#fff" opacity={0.9} rx={0.119} />
    <rect width={6.904} height={1.56} x={4.803} y={9.392} fill="#fff" opacity={0.6} rx={0.128} />
    <rect width={1.234} height={4.45} x={15.419} y={6.494} fill="#fff" opacity={0.9} rx={0.091} />
    <path
      fill="#fff"
      d="M10.835 3.869 9.119 6.922 7.305 5.073 5.434 7.498l.439.344 1.483-1.913L9.24 7.851l2.081-3.702z"
    />
    <ellipse cx={7.326} cy={5.499} fill="#fff" rx={0.705} ry={0.709} />
    <ellipse cx={9.24} cy={7.258} fill="#fff" rx={0.705} ry={0.709} />
    <ellipse cx={11.016} cy={4.097} fill="#fff" rx={0.705} ry={0.709} />
    <ellipse cx={5.727} cy={7.567} fill="#fff" rx={0.705} ry={0.709} />
    {'\u200B'}
  </svg>
)}
export default SvgDashboardHub
