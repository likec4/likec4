// @ts-nocheck

import type { SVGProps } from 'react'
const SvgWorkflow = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={2.624} x2={2.624} y1={15.969} y2={11.167} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.601} stopColor="#81ce31" />
        <stop offset={0.822} stopColor="#86d633" />
      </linearGradient>
      <linearGradient id="b" x1={9.026} x2={9.026} y1={18} y2={13.198} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.601} stopColor="#81ce31" />
        <stop offset={0.822} stopColor="#86d633" />
      </linearGradient>
      <linearGradient id="c" x1={15.376} x2={15.376} y1={16.001} y2={11.199} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.601} stopColor="#81ce31" />
        <stop offset={0.822} stopColor="#86d633" />
      </linearGradient>
    </defs>
    <path
      fill="#50e6ff"
      d="M15.509 7.868h-5.457a.293.293 0 0 1-.293-.293V5.491H8.293v2.084A.294.294 0 0 1 8 7.868H2.479a.587.587 0 0 0-.587.587v2.7h1.466v-1.5a.294.294 0 0 1 .294-.293h4.641v3.918h1.466V9.368h4.577a.293.293 0 0 1 .293.293v1.53H16.1V8.455a.587.587 0 0 0-.591-.587"
    />
    <rect width={5.881} height={5.881} x={6.029} fill="#0078d4" rx={0.532} />
    <rect width={3.622} height={3.622} x={7.158} y={1.13} fill="#fff" rx={0.328} />
    <rect width={4.802} height={4.802} x={0.223} y={11.167} fill="url(#a)" rx={0.435} />
    <rect width={4.802} height={4.802} x={6.624} y={13.198} fill="url(#b)" rx={0.435} />
    <rect width={4.802} height={4.802} x={12.975} y={11.199} fill="url(#c)" rx={0.435} />
  </svg>
)
export default SvgWorkflow
