// @ts-nocheck

import type { SVGProps } from 'react'
const SvgSupplyChain = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#BD0816" />
        <stop offset="100%" stopColor="#FF5252" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M58 36v14a1 1 0 0 1-.472.849L45 58.644v-2.355l11-6.846V37.79l-11 6.769v-2.35l11.476-7.062A1.002 1.002 0 0 1 58 36M24 49.44l11 6.77v2.349l-12.524-7.707A1 1 0 0 1 22 50V36a1.001 1.001 0 0 1 1.524-.852L35 42.209v2.35l-11-6.77zm27-1.465-10.511 5.896a.99.99 0 0 1-.987-.005L29 47.829v-2.306l11.006 6.328L51 45.682zM41 65.22V59h-2v6.22L18 52.439V27.66l21 11.92V44h2v-4.418l21-11.92v24.777zm-1-51.072 20.968 11.8L40 37.85 19.032 25.947zm23.49 10.925-23-12.944a1 1 0 0 0-.98 0l-23 12.944a1 1 0 0 0-.51.872V53a1 1 0 0 0 .48.853l23 14a1 1 0 0 0 1.04 0l23-14A1 1 0 0 0 64 53V25.943a1 1 0 0 0-.51-.87"
      />
    </g>
  </svg>
)
export default SvgSupplyChain
