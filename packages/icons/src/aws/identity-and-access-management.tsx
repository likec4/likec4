import type { SVGProps } from 'react'
const SvgIdentityAndAccessManagement = (props: SVGProps<SVGSVGElement>) => (
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
        d="M14 59h52V21H14zm54-39v40a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1V20a1 1 0 0 1 1-1h54a1 1 0 0 1 1 1M44 48h15v-2H44zm13-6h5v-2h-5zm-13 0h8v-2h-8zm-15 4a1.001 1.001 0 0 0-2 0 1.001 1.001 0 0 0 2 0m2 0a3 3 0 0 1-2 2.816V51h-2v-2.185A2.995 2.995 0 0 1 25 46c0-1.654 1.346-3 3-3s3 1.346 3 3m-12 7.993L36.994 54l.002-4H33v-2h3.996l.002-3H33v-2h3.999L37 40.007 19.006 40zm3-15.992 12 .005V31c.001-2.303-2.803-4.323-6-4.325h-.004c-3.192 0-5.992 2.021-5.994 4.325zm-5 16.991L17.006 39a1 1 0 0 1 1-1l1.994.001.002-7.001c.002-3.488 3.588-6.325 7.994-6.325H28c4.412.002 8.001 2.84 8 6.325v7.007l2 .001a1 1 0 0 1 1 1L38.994 55a1 1 0 0 1-1 1L18 55.992a1 1 0 0 1-1-1M60 36h2v-2h-2zm-16 0h11v-2H44z"
      />
    </g>
  </svg>
)
export default SvgIdentityAndAccessManagement
