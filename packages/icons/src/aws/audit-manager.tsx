import type { SVGProps } from 'react'
const SvgAuditManager = (props: SVGProps<SVGSVGElement>) => (
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
        d="m62.707 52.293-1.414 1.414L64.586 57H54v2h10.586l-3.293 3.293 1.414 1.414 5-5a1 1 0 0 0 0-1.414zM36 59h10.586l-3.293 3.293 1.414 1.414 5-5a1 1 0 0 0 0-1.414l-5-5-1.414 1.414L46.586 57H36zm-9.293 4.707 5-5a1 1 0 0 0 0-1.414l-5-5-1.414 1.414L28.586 57H18v2h10.586l-3.293 3.293zM18 46h18v-2H18zm0-11h18v-2H18zm24 0h6v-3h-6zm7-5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1zm-7 17h24v-3H42zm26-4v5a1 1 0 0 1-1 1H41a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h26a1 1 0 0 1 1 1M47 21h5.586L47 15.414zm7 42h2v4a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1V13a1 1 0 0 1 1-1h33c.266 0 .52.105.707.293l9 9A1 1 0 0 1 56 22v17h-2V23h-8a1 1 0 0 1-1-1v-8H14v52h40zM27 28a1 1 0 0 1-.707-.293l-4-4 1.414-1.414L27 25.586l7.293-7.293 1.414 1.414-8 8A1 1 0 0 1 27 28"
      />
    </g>
  </svg>
)
export default SvgAuditManager
