/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgBillingConductor = (props) => (
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
        d="M14 51h11v-2H14zm3-6h8v-2h-8zm-4-6h12v-2H13zm33 15h5v-2h-5zm-7 0h5v-2h-5zm-7 0h5v-2h-5zm14-5h5v-2h-5zm-7 0h5v-2h-5zm-7 0h5v-2h-5zm2-9h15v-3H34zm16-5H33a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1M29 58h25V32H29zm26 2a1 1 0 0 0 1-1V31a1 1 0 0 0-1-1H28a1 1 0 0 0-1 1v28a1 1 0 0 0 1 1zm-4-44.727L59.43 23H51zm11.676 7.99-12-11A1 1 0 0 0 50 12H21a1 1 0 0 0-1 1v22h2V14h27v10a1 1 0 0 0 1 1h11v41H22V53h-2v14a1 1 0 0 0 1 1h41a1 1 0 0 0 1-1V24a1 1 0 0 0-.324-.737"
      />
    </g>
  </svg>
)
export default SvgBillingConductor
