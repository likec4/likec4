// @ts-nocheck

import type { SVGProps } from 'react'
const SvgReservations = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <radialGradient id="Reservations_svg__a" cx={8.81} cy={9} r={8.41} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#7956ba" />
        <stop offset={0.69} stopColor="#724eb4" />
        <stop offset={0.87} stopColor="#6f4bb2" />
      </radialGradient>
      <radialGradient id="Reservations_svg__b" cx={8.8} cy={9.11} r={1.19} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#7f7f7f" />
        <stop offset={1} stopColor="#5e5e5e" />
      </radialGradient>
    </defs>
    <circle cx={8.83} cy={9.08} r={8.5} fill="#b0b0b0" />
    <circle cx={8.81} cy={9.05} r={7.22} fill="#fff" />
    <path
      fill="#7a7a7a"
      d="m12.228 5.329.898-.898.29.29-.898.898zM13.81 8.87h1.27v.41h-1.27zM12.164 12.751l.29-.29.897.898-.29.29zM8.58 14.09h.41v1.27h-.41zM4.1 4.681l.29-.29.899.898-.29.29zM4.158 13.401l.898-.898.29.29-.898.898zM2.4 8.87h1.27v.41H2.4z"
    />
    <path
      fill="url(#Reservations_svg__a)"
      d="M8.84.58a.61.61 0 0 0-.61.62.63.63 0 0 0 .62.63 7.26 7.26 0 1 1-5.36 2.35l.51.74 1.42-3.16-3.42.4.75 1A8.49 8.49 0 1 0 8.84.58"
    />
    <rect width={1.14} height={6.51} x={8.29} y={2.84} fill="#7a7a7a" rx={0.52} />
    <rect width={1.14} height={4.08} x={9.82} y={8.65} fill="#7a7a7a" rx={0.52} transform="rotate(135 10.385 10.693)" />
    <circle cx={8.81} cy={9.08} r={1.2} fill="url(#Reservations_svg__b)" />
  </svg>
)
export default SvgReservations
