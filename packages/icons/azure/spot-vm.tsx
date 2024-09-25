// @ts-nocheck

import type { SVGProps } from 'react'
const SvgSpotVm = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={12.513} y2={1.065} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.817} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id="b" x1={9.003} x2={9.003} y1={16.935} y2={12.512} gradientUnits="userSpaceOnUse">
        <stop offset={0.149} stopColor="#ccc" />
        <stop offset={1} stopColor="#707070" />
      </linearGradient>
      <linearGradient id="c" x1={9.029} x2={9.029} y1={0.189} y2={10.695} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
    </defs>
    <rect width={17.171} height={11.447} x={0.415} y={1.065} fill="url(#a)" rx={0.548} />
    <path
      fill="url(#b)"
      d="M12.443 15.975c-1.7-.265-1.764-1.49-1.759-3.463H7.316c0 1.973-.062 3.2-1.76 3.463a1 1 0 0 0-.846.96h8.59a1 1 0 0 0-.857-.96"
    />
    <circle cx={9.029} cy={6.685} r={4.045} fill="url(#c)" />
    <path fill="#50e6ff" d="M11.41 5.367v2.759L9.025 9.513V6.749z" />
    <path fill="#c3f1ff" d="M11.41 5.367 9.026 6.753 6.641 5.367 9.026 3.98z" />
    <path fill="#9cebff" d="m9.031 6.763-.024 2.76-2.372-1.407.024-2.76z" />
    <path
      fill="#fff"
      d="M12.23 3.582a.324.324 0 0 0-.459 0 .336.336 0 0 0 0 .471 3.865 3.865 0 1 1-2.9-1.133l-.047.253a.125.125 0 0 0 .166.139l1.247-.474a.164.164 0 0 0 .043-.283l-1.04-.823a.124.124 0 0 0-.2.08l-.064.445a4.519 4.519 0 1 0 3.254 1.325"
    />
  </svg>
)
export default SvgSpotVm
