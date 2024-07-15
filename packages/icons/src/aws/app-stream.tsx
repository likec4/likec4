import type { SVGProps } from 'react'
const SvgAppStream = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#055F4E" />
        <stop offset="100%" stopColor="#56C0A7" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M40.062 39v24.711L15.407 39zm1.38 28.049a1 1 0 0 0 .616-.924V38c0-.552-.446-1-.998-1H12.998a.998.998 0 0 0-.705 1.707l28.062 28.125a1 1 0 0 0 1.087.217m25.56.951a1 1 0 0 1-.705-.293l-20.205-20.25 1.41-1.414 18.502 18.543V14H15.531l18.502 18.543-1.41 1.414-20.206-20.25A1.002 1.002 0 0 1 13.123 12h53.88c.551 0 .997.448.997 1v54a1 1 0 0 1-.998 1"
      />
    </g>
  </svg>
)
export default SvgAppStream
