// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgWorkspaceGateway = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={936.099}
        x2={940.061}
        y1={1455.675}
        y2={1455.675}
        gradientTransform="translate(-924.399 -1443.515)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#6f4bb2" />
        <stop offset={1} stopColor="#c69aeb" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.808} x2={17.516} y1={12.133} y2={12.133} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#83b9f9" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={7.895} x2={7.895} y1={12.948} y2={1.364} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.09} stopColor="#1f9dc4" />
        <stop offset={0.24} stopColor="#28b5d9" />
        <stop offset={0.4} stopColor="#2dc6e9" />
        <stop offset={0.57} stopColor="#31d1f2" />
        <stop offset={0.78} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <rect
      width={3.184}
      height={3.184}
      x={11.863}
      y={10.569}
      fill={`url(#a-${suffix})`}
      rx={1.572}
      ry={1.572}
      transform="rotate(-45 13.455 12.16)"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M14.752 14.328a2.51 2.51 0 0 1-3.481-3.466.43.43 0 1 0-.721-.472 3.38 3.38 0 0 0 .157 3.908l-.544.544a.9.9 0 0 0-.887.229l-.016.016a.9.9 0 0 0-.002 1.27l.016.016a.9.9 0 0 0 1.272 0l.016-.016a.9.9 0 0 0 .218-.911l.539-.539a3.38 3.38 0 0 0 3.909.142.432.432 0 0 0-.475-.721Zm2.986-6.418-.001-.001-.016-.016a.9.9 0 0 0-1.272 0l-.016.016a.9.9 0 0 0-.227.89l-.544.544a3.38 3.38 0 0 0-3.907-.158.43.43 0 0 0 .473.722 2.51 2.51 0 0 1 3.466 3.481.432.432 0 0 0 .72.476 3.38 3.38 0 0 0-.145-3.906l.541-.541c.32.104.672.02.911-.218l.016-.016a.9.9 0 0 0 .003-1.272Z"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M9.261 12.027H4.968l-.038.003a4 4 0 0 1-.328.014H4.57l-.131.003A3.53 3.53 0 0 1 .902 8.673a3.46 3.46 0 0 1 3.059-3.321l.545-.066.191-.515a3.86 3.86 0 0 1 3.604-2.506h.114l.118-.002a3.72 3.72 0 0 1 3.72 3.565l.033.755.749.099c.945.125 1.72.711 2.117 1.516.095.039.191.075.283.12.04-.295.165-.573.356-.81a3.66 3.66 0 0 0-2.638-1.719 4.626 4.626 0 0 0-4.619-4.427q-.072 0-.145.002h-.087a4.74 4.74 0 0 0-4.448 3.094A4.38 4.38 0 0 0 0 8.678a4.446 4.446 0 0 0 4.438 4.27q.08 0 .163-.003c.137 0 .275-.006.404-.017h4.314a4 4 0 0 1-.059-.901Z"
    />
  </svg>
)}
export default SvgWorkspaceGateway
