// @ts-nocheck

import type { SVGProps } from 'react'
const SvgActivate = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#2E27AD" />
        <stop offset="100%" stopColor="#527FFF" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M66.008 39.28c0 11.078-6.833 20.585-16.504 24.542v-2.177C58.043 57.81 64.008 49.23 64.008 39.28c0-11.95-8.597-21.921-19.93-24.073l-.933-2.178C56.042 14.81 66.008 25.9 66.008 39.279M29.504 61.645v2.177C19.833 59.865 13 50.358 13 39.28c0-13.377 9.962-24.465 22.857-26.25l-.935 2.179C23.592 17.363 15 27.334 15 39.279c0 9.952 5.965 18.53 14.504 22.366m2 6.355h2V49h-2zm14 0h2V49h-2zm-7-5h2V42h-2zm1-47.61 10.48 24.52-9.87-7.526a1.03 1.03 0 0 0-1.232.01l-9.86 7.518zM25.998 43.797a1 1 0 0 0 1.22.006l12.288-9.367 12.283 9.367a1 1 0 0 0 1.22-.006c.359-.28.484-.765.307-1.182L40.489 12.607a1 1 0 0 0-.92-.607h-.13c-.401 0-.762.239-.92.607L25.693 42.614c-.178.417-.053.903.305 1.182"
      />
    </g>
  </svg>
)
export default SvgActivate
