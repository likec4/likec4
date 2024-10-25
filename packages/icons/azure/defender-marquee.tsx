// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDefenderMarquee = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" {...props}>
    <path fill={`url(#a-${suffix})`} fillRule="evenodd" d="M17.654 4.348H.348v10.104h17.306zM0 4v10.8h18V4z" clipRule="evenodd" />
    <path fill={`url(#b-${suffix})`} d="M.348 4.348h17.306v10.104H.348z" />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M5.083 7H2.587l-.215.12-.005-.005-.035.029-.041.023.004.005-.16.126-.35 2.07.24.276-.02.016.018.02-.276.19-.349 2.092.182.268.539-.421.271-1.766H4.4l-.304 1.742.384.457.262-.16.351-2.085-.256-.28.03-.028-.007-.007.298-.24.323-2.018-.144-.171.002-.002-.017-.016-.056-.067-.007.005zm-2.33.672L2.46 9.349h2.026l.239-1.677zM7.213 7.604l-.397-.489-.232.183-.35 2.07.26.297-.298.205-.35 2.092.182.268.016-.012.169.2H8.69l.318-.196-.383-.502-2.043-.004.268-1.742-.24-.294.279-.211zM13.761 7h-2.496l-.296.167.381.505h2.055l-.239 1.677h-2.063l-.42.31.02.02-.277.191-.35 2.092.182.268.016-.012.169.2h2.477l.318-.196-.383-.502-2.043-.004.257-1.673h2.087l.388-.354-.006-.007.298-.24.323-2.018-.144-.171.001-.002L14 7.235l-.056-.067-.006.005zM16.602 7.424l-.216-.256-.524.404-.263 1.85.237.262-.3.265-.32 1.836.385.457.262-.16.351-2.085-.265-.29.33-.266z"
      clipRule="evenodd"
    />
    <defs>
      <linearGradient id={`a-${suffix}`} x1={-0.086} x2={17.914} y1={9.4} y2={9.4} gradientUnits="userSpaceOnUse">
        <stop stopColor="#005BA1" />
        <stop offset={0.07} stopColor="#0060A9" />
        <stop offset={0.36} stopColor="#0071C8" />
        <stop offset={0.52} stopColor="#0078D4" />
        <stop offset={0.64} stopColor="#0074CD" />
        <stop offset={0.82} stopColor="#006ABB" />
        <stop offset={1} stopColor="#005BA1" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={-0.086} x2={17.914} y1={9.4} y2={9.4} gradientUnits="userSpaceOnUse">
        <stop stopColor="#005BA1" />
        <stop offset={0.07} stopColor="#0060A9" />
        <stop offset={0.36} stopColor="#0071C8" />
        <stop offset={0.52} stopColor="#0078D4" />
        <stop offset={0.64} stopColor="#0074CD" />
        <stop offset={0.82} stopColor="#006ABB" />
        <stop offset={1} stopColor="#005BA1" />
      </linearGradient>
    </defs>
  </svg>
)}
export default SvgDefenderMarquee
