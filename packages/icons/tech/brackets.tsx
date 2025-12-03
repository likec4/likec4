// @ts-nocheck

import type { SVGProps } from 'react'
const SvgBrackets = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 256" {...props}>
    <defs>
      <filter id="brackets_svg__b" width="200%" height="200%" x="-50%" y="-50%" filterUnits="objectBoundingBox">
        <feOffset dy={2} in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation={2} />
        <feColorMatrix
          in="shadowBlurOuter1"
          result="shadowMatrixOuter1"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.273992301 0"
        />
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="brackets_svg__c" width="200%" height="200%" x="-50%" y="-50%" filterUnits="objectBoundingBox">
        <feOffset dy={2} in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation={2} />
        <feColorMatrix
          in="shadowBlurOuter1"
          result="shadowMatrixOuter1"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.273992301 0"
        />
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="brackets_svg__a" x1="50%" x2="50%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#29ABE2" />
        <stop offset="47.57%" stopColor="#28A9E1" />
        <stop offset="66.39%" stopColor="#23A2DC" />
        <stop offset="80.12%" stopColor="#1A96D4" />
        <stop offset="91.3%" stopColor="#0E85C9" />
        <stop offset="100%" stopColor="#0071BC" />
      </linearGradient>
    </defs>
    <path
      fill="#115A91"
      d="M256 204.8c0 28.16-23.04 51.2-51.2 51.2H51.2C23.04 256 0 232.96 0 204.8V51.2C0 23.04 23.04 0 51.2 0h153.6C232.96 0 256 23.04 256 51.2z"
    />
    <path
      fill="#FFF"
      d="M204.8 28.16c12.705 0 23.04 10.335 23.04 23.04v128c0 12.705-10.335 23.04-23.04 23.04H51.2c-12.705 0-23.04-10.335-23.04-23.04v-128c0-12.705 10.335-23.04 23.04-23.04z"
    />
    <path
      fill="url(#brackets_svg__a)"
      d="M204.8 28.16c12.705 0 23.04 10.335 23.04 23.04v128c0 12.705-10.335 23.04-23.04 23.04H51.2c-12.705 0-23.04-10.335-23.04-23.04v-128c0-12.705 10.335-23.04 23.04-23.04zm0-28.16H51.2C23.04 0 0 23.04 0 51.2v128c0 28.16 23.04 51.2 51.2 51.2h153.6c28.16 0 51.2-23.04 51.2-51.2v-128C256 23.04 232.96 0 204.8 0"
    />
    <g fill="#4D4D4D">
      <path
        d="M143.36 0v122.88h-64V92.16h35.84v-64H79.36V0z"
        filter="url(#brackets_svg__b)"
        transform="translate(56.32 53.76)"
      />
      <path d="M64 0v28.16H28.16v64H64v30.72H0V0z" filter="url(#brackets_svg__c)" transform="translate(56.32 53.76)" />
    </g>
  </svg>
)
export default SvgBrackets
