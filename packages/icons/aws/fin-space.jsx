/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgFinSpace = (props) => (
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
        d="M24 56h4V30.392l-4 2.728zm11-30.38-5 3.408V56h5zm2-1.364V56h6V24.256l-3-2.046zm13 4.772-5-3.408V56h5zm6 4.092-4-2.728V56h4zM63 58H17v-2h5V34.483l-3.437 2.343-1.126-1.652 22-15a1 1 0 0 1 1.126 0l22 15-1.126 1.652L58 34.483V56h5zm-48 5h10v-2H15zm14 0h22v-2H29zm26 0h10v-2H55zm-43 5h25v-2H12zm31 0h25v-2H43zM13.555 32.832l-1.11-1.664 27-18a1 1 0 0 1 1.11 0l27 18-1.11 1.664L40 15.202z"
      />
    </g>
  </svg>
)
export default SvgFinSpace
