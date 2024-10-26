// @ts-nocheck

import type { SVGProps } from 'react'
const SvgBranch = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id="Branch_svg__a"
        x1={9}
        x2={9}
        y1={19.848}
        y2={-1.014}
        gradientTransform="rotate(45 9 9)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.502} stopColor="#4093e6" />
        <stop offset={0.775} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <rect
      width={13.079}
      height={13.079}
      x={2.46}
      y={2.46}
      fill="url(#Branch_svg__a)"
      rx={0.6}
      transform="rotate(-45 9 9)"
    />
    <path
      fill="#c3f1ff"
      d="m14.728 8.735-1.692-1.526c-.23-.229-.334-.172-.334.172v.676a.213.213 0 0 1-.213.212 2.41 2.41 0 0 1-2.549-1.49V3.62a.29.29 0 0 0-.291-.291H8.191a.29.29 0 0 0-.291.291v7.98a.143.143 0 0 1-.143.143H6.1a.144.144 0 0 0-.1.245l2.695 2.7a.32.32 0 0 0 .454 0l2.7-2.695a.144.144 0 0 0-.1-.245h-1.666a.143.143 0 0 1-.143-.148V8.917a4.44 4.44 0 0 0 2.548.7.21.21 0 0 1 .214.211v.73c0 .286.155.351.334.172l1.692-1.646a.21.21 0 0 0 0-.349"
    />
  </svg>
)
export default SvgBranch
