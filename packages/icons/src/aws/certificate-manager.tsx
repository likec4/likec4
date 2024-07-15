import type { SVGProps } from 'react'
const SvgCertificateManager = (props: SVGProps<SVGSVGElement>) => (
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
        d="M35.694 39.281a1 1 0 0 1 .283.932l-1.025 4.709 4.525-2.774a1 1 0 0 1 1.047.001l4.492 2.767-.995-4.717c-.07-.335.035-.682.279-.921l4.039-3.954-5.266-.76a1 1 0 0 1-.756-.551l-2.326-4.762-2.381 4.774a1 1 0 0 1-.75.543l-5.251.767zm-3.195 7.506 1.405-6.455-5.148-4.973a1 1 0 0 1 .549-1.708l6.748-.987 3.052-6.119c.169-.34.489-.574.899-.554.38.002.727.22.894.561l2.984 6.108 6.744.975a1 1 0 0 1 .807.679 1 1 0 0 1-.251 1.025l-5.091 4.984 1.363 6.46a1 1 0 0 1-1.503 1.059l-5.952-3.668-6 3.678a.99.99 0 0 1-1.102-.037 1 1 0 0 1-.398-1.028M14 21.021h52V16H14zM68 15v50a1 1 0 0 1-1 1h-6v-2h5V23.022H14V64h38v2H13a1 1 0 0 1-1-1V15a1 1 0 0 1 1-1h54a1 1 0 0 1 1 1M24 59h6v-2h-6zm10 0h14v-2H34zm-10-5h6v-2h-6zm10 0h22v-2H34z"
      />
    </g>
  </svg>
)
export default SvgCertificateManager
