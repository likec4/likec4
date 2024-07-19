/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgStepFunctions = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M45 44h21v-7H45zm22-9H44a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h23a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1M43.5 62.5c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5S38.07 59 40 59s3.5 1.57 3.5 3.5M14 47h18v-4H14zm0-10h18v-4H14zm22.5-19.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5S41.93 21 40 21s-3.5-1.57-3.5-3.5M56 53H24v-4h9a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-9v-2h9a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-9v-3h32v4h2v-5a1 1 0 0 0-1-1H41v-3.096c2.556-.472 4.5-2.713 4.5-5.404 0-3.033-2.468-5.5-5.5-5.5a5.506 5.506 0 0 0-5.5 5.5c0 2.691 1.944 4.932 4.5 5.404V26H23a1 1 0 0 0-1 1v4h-9a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h9v2h-9a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h9v5a1 1 0 0 0 1 1h16v2.096c-2.556.472-4.5 2.713-4.5 5.404 0 3.033 2.468 5.5 5.5 5.5s5.5-2.467 5.5-5.5c0-2.691-1.944-4.932-4.5-5.404V55h16a1 1 0 0 0 1-1v-4.973h-2z"
      />
    </g>
  </svg>
)
export default SvgStepFunctions
