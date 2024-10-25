// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDefenderDistributerControlSystem = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" {...props}>
    <g clipPath={`url(#a-${suffix})`}>
      <path
        fill={`url(#b-${suffix})`}
        d="M.707 8.293 8.293.707a1 1 0 0 1 1.414 0l7.586 7.586a1 1 0 0 1 0 1.414l-7.586 7.586a1 1 0 0 1-1.414 0L.707 9.707a1 1 0 0 1 0-1.414"
      />
      <path
        fill="#fff"
        d="M9.176 14.763a1.828 1.828 0 1 1 0-3.655 1.828 1.828 0 0 1 0 3.655m0-2.882a1.055 1.055 0 1 0 .013 2.11 1.055 1.055 0 0 0-.013-2.11"
        opacity={0.9}
      />
      <path
        fill={`url(#c-${suffix})`}
        d="M13.437 6.454h-2.293a.08.08 0 0 0-.08.096.1.1 0 0 0 .023.041l.655.655a.093.093 0 0 1 0 .132L9.966 9.154c-.08.079-.137.171-.21.254v-4.74a.08.08 0 0 1 .08-.08h.957a.082.082 0 0 0 .058-.139L9.225 2.83a.08.08 0 0 0-.113 0L7.495 4.45a.082.082 0 0 0 .057.139H8.5a.09.09 0 0 1 .081.08v4.737c-.072-.082-.129-.173-.207-.25L6.6 7.377a.09.09 0 0 1 0-.132l.654-.655a.08.08 0 0 0 0-.112.08.08 0 0 0-.057-.023H4.904a.08.08 0 0 0-.08.08v2.29a.08.08 0 0 0 .08.08q.034 0 .057-.022l.686-.686a.09.09 0 0 1 .132 0l1.775 1.775c.371.374.65.83.817 1.33a1.76 1.76 0 0 1 1.597-.007c.168-.498.447-.95.817-1.323l1.775-1.775a.093.093 0 0 1 .133 0l.687.686a.1.1 0 0 0 .055.023.08.08 0 0 0 .082-.08V6.534a.08.08 0 0 0-.08-.08"
      />
    </g>
    <defs>
      <linearGradient id={`b-${suffix}`} x1={9} x2={9} y1={18} y2={0} gradientUnits="userSpaceOnUse">
        <stop stopColor="#0078D4" />
        <stop offset={0.156} stopColor="#1380DA" />
        <stop offset={0.528} stopColor="#3C91E5" />
        <stop offset={0.822} stopColor="#559CEC" />
        <stop offset={1} stopColor="#5EA0EF" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={9.17} x2={9.17} y1={3.575} y2={10.887} gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff" />
        <stop offset={1} stopColor="#fff" stopOpacity={0.7} />
      </linearGradient>
      <clipPath id={`a-${suffix}`}>
        <path fill="#fff" d="M0 0h18v18H0z" />
      </clipPath>
    </defs>
  </svg>
)}
export default SvgDefenderDistributerControlSystem
