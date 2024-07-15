import type { SVGProps } from 'react'
const SvgApplicationCostProfiler = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#1B660F" />
        <stop offset="100%" stopColor="#6CAE3E" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M66 35h2V21h-2zm-9 0h2V12h-2zm-9 10h2V25h-2zm-9 5h2V18h-2zm-24.979-9h6.976c.441 9.737 8.265 17.562 18.003 18.003v6.975C25.424 65.531 14.469 54.576 14.021 41M30 16.264v7.745c-5.34 3.269-8.647 8.803-9.011 14.991h-6.853C14.578 28.997 20.778 20.109 30 16.264m11 49.707v-6.982c9.895-.594 17.768-8.809 17.768-18.849h-2c0 9.322-7.585 16.906-16.908 16.906-9.322 0-16.907-7.584-16.907-16.906 0-5.521 2.612-10.555 7.047-13.73V40h2V13.394l-1.333.471c-11.11 3.927-18.574 14.486-18.574 26.275H12C12 55.502 24.498 68 39.86 68s27.861-12.498 27.861-27.86h-2c0 13.877-10.989 25.232-24.721 25.831"
      />
    </g>
  </svg>
)
export default SvgApplicationCostProfiler
