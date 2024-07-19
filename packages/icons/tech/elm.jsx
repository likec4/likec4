/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgElm = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#efa500" d="m64 60.74 25.65-25.65h-51.3z" />
    <path
      fill="#8dd737"
      d="m7.91 4.65 25.83 25.84h56.17L64.07 4.65zm59.353 59.343 28.08-28.08 27.951 27.953-28.08 28.079z"
    />
    <path fill="#60b5cc" d="M123.35 57.42V4.65H70.58z" />
    <path fill="#34495e" d="M60.74 64 4.65 7.91V120.1z" />
    <path fill="#efa500" d="m98.47 95.21 24.88 24.89V70.33z" />
    <path fill="#60b5cc" d="M64 67.26 7.91 123.35h112.18z" />
  </svg>
)
export default SvgElm
