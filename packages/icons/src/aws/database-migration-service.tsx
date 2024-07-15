import type { SVGProps } from 'react'
const SvgDatabaseMigrationService = (props: SVGProps<SVGSVGElement>) => (
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
        d="M44 67h2v-7h-2zm-9-.14h2V60h-2zM53 65h2v-6h-2zm-27 0h2v-6h-2zm14-30c-7.511 0-12-2.034-12-4v-7.641C30.32 25.022 34.533 26 40 26c4.983 0 10.225-.894 13-2.8V31c0 1.932-5.223 4-13 4m0 10c-7.511 0-12-2.034-12-4v-6.641C30.32 36.022 34.533 37 40 37c4.983 0 10.225-.894 13-2.8V41c0 1.932-5.223 4-13 4m0 10c-7.794 0-12-2.061-12-4v-6.641C30.32 46.022 34.533 47 40 47c4.983 0 10.225-.894 13-2.8V51c0 1.932-5.223 4-13 4m0-39c7.661 0 13 2.108 13 4s-5.339 4-13 4c-7.511 0-12-2.034-12-4s4.489-4 12-4m0-2c-8.505 0-14 2.355-14 6v31c0 3.645 5.495 6 14 6 7.225 0 15-1.877 15-6V20c0-4.123-7.775-6-15-6"
      />
    </g>
  </svg>
)
export default SvgDatabaseMigrationService
