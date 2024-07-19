/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgVpcLattice = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#4D27A8" />
        <stop offset="100%" stopColor="#A166FF" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M49 43.943c0 5.664-2.692 8.693-8 9.024V27.806l8 3.059zm-18 0V30.865l8-3.059v25.151c-6.57-.43-8-5.077-8-9.014m8.643-18.524-10 3.823a1 1 0 0 0-.643.934v13.767C29 47.267 30.072 55 40 55c7.094 0 11-3.927 11-11.057V30.176a1 1 0 0 0-.643-.934l-10-3.823a1 1 0 0 0-.714 0M54 43.943C54 56.986 43.284 58 40 58c-13.325 0-14-11.71-14-14.057v-16.52l14-5.353 14 5.353zM14 21h7v-7h-7zm45 0h7v-7h-7zm0 45h7v-7h-7zm-45 0h7v-7h-7zm53-43a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v8.586l-3.504 3.504-13.139-5.024a1 1 0 0 0-.714 0L26.504 25.09 23 21.586V13a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h8.586l2.894 2.894a.99.99 0 0 0-.48.841v17.208c0 2.86.634 5.901 2.081 8.562L21.586 57H13a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-8.586l4.188-4.188C29.681 57.585 33.773 60 40 60c6.7 0 10.6-2.59 12.868-5.718L57 58.414V67a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-8.586l-4.466-4.466C55.817 48.981 56 45.23 56 43.943V26.735c0-.35-.19-.661-.48-.841L58.414 23z"
      />
    </g>
  </svg>
)
export default SvgVpcLattice
