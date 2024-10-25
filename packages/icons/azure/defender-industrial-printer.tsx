// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDefenderIndustrialPrinter = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" {...props}>
    <g clipPath={`url(#a-${suffix})`}>
      <path
        fill="#005BA1"
        d="M2.532 0h12.936c.207 0 .414.12.414.24v2.697c0 .12-.207.24-.414.24H2.532c-.207 0-.414-.12-.414-.24V.24c0-.18.207-.24.414-.24"
      />
      <path fill="#5EA0EF" d="M.964 1.059h16.072c.535 0 .964.605.964 1.361v13.462H0V2.42C0 1.664.429 1.06.964 1.06" />
      <path fill="#0078D4" d="M17.682 14.082H0v1.589h17.682z" />
      <path
        fill="#83B9F9"
        d="M2.753 11.33h12.176c.212 0 .424.211.424.423v.953a.456.456 0 0 1-.424.424H2.753a.455.455 0 0 1-.424-.424v-.953c0-.212.212-.424.424-.424"
      />
      <path fill="#C3F1FF" d="M14.718 8.365a.424.424 0 1 0 0-.847.424.424 0 0 0 0 .847" />
      <path fill={`url(#b-${suffix})`} d="M3.176 11.647h11.33v5.93a.455.455 0 0 1-.424.423H3.6a.455.455 0 0 1-.424-.424z" />
    </g>
    <defs>
      <linearGradient id={`b-${suffix}`} x1={8.839} x2={8.839} y1={18} y2={11.657} gradientUnits="userSpaceOnUse">
        <stop stopColor="#C3F1FF" />
        <stop offset={0.999} stopColor="#9CEBFF" />
      </linearGradient>
      <clipPath id={`a-${suffix}`}>
        <path fill="#fff" d="M0 0h18v18H0z" />
      </clipPath>
    </defs>
  </svg>
)}
export default SvgDefenderIndustrialPrinter
